import { BloodType } from '@/types/domain';

/** Who a donor of type X can give red cells to (recipient types). */
const DONOR_TO_RECIPIENTS: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

/** Can a donor with `donor` blood type give to a recipient needing `recipient`? */
export function canDonateTo(donor: BloodType, recipient: BloodType): boolean {
  return DONOR_TO_RECIPIENTS[donor].includes(recipient);
}

/** Recipient types a given donor type can serve. */
export function recipientsFor(donor: BloodType): BloodType[] {
  return DONOR_TO_RECIPIENTS[donor];
}

/** Donor types that can serve a given recipient (compatible donors). */
export function donorsFor(recipient: BloodType): BloodType[] {
  return (Object.keys(DONOR_TO_RECIPIENTS) as BloodType[]).filter((d) =>
    canDonateTo(d, recipient),
  );
}

export const UNIVERSAL_DONOR: BloodType = 'O-';
export const UNIVERSAL_RECIPIENT: BloodType = 'AB+';

/** Standard interval between whole-blood donations (days). */
export const DONATION_INTERVAL_DAYS = 56;

export interface Eligibility {
  eligible: boolean;
  daysRemaining: number;
  nextEligibleDate: Date;
  progress: number; // 0..1 toward next eligible date
}

export function computeEligibility(lastDonationISO?: string, now = new Date()): Eligibility {
  if (!lastDonationISO) {
    return { eligible: true, daysRemaining: 0, nextEligibleDate: now, progress: 1 };
  }
  const last = new Date(lastDonationISO);
  const next = new Date(last);
  next.setDate(next.getDate() + DONATION_INTERVAL_DAYS);
  const msDay = 86_400_000;
  const daysRemaining = Math.max(0, Math.ceil((next.getTime() - now.getTime()) / msDay));
  const elapsed = Math.min(DONATION_INTERVAL_DAYS, (now.getTime() - last.getTime()) / msDay);
  return {
    eligible: daysRemaining <= 0,
    daysRemaining,
    nextEligibleDate: next,
    progress: Math.max(0, Math.min(1, elapsed / DONATION_INTERVAL_DAYS)),
  };
}
