/**
 * Seed the Blood Bridge database: global content (centers, announcements, articles)
 * plus demo users with donations and open emergency requests so the feed and
 * detail screens feel alive. New real users start with empty personal data.
 *
 * Idempotent: previous demo users (any *@bloodbridge.demo email) are deleted first
 * (cascades to their requests/responders/donations/appointments); global
 * content is re-inserted; centers are upserted so real users' appointments
 * keep valid references.
 *
 * Run: npm run db:seed
 * Demo accounts (password for all): bloodbridge-demo-123
 *   amara@bloodbridge.demo  (A+, eligible to donate)
 *   daniel@bloodbridge.demo (A+, mid donation cooldown)
 *   liam@bloodbridge.demo   (A-, eligible to donate)
 */
import 'dotenv/config';

import { inArray, like } from 'drizzle-orm';

import {
  announcements,
  appointments,
  donationCenters,
  donations,
  educationArticles,
  emergencyRequests,
  profiles,
  responders,
  user,
} from '../src/db/schema';
import { auth } from '../src/lib/server/auth';
import { db } from '../src/lib/server/db';

const DEMO_PASSWORD = 'bloodbridge-demo-123';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000);
const inHours = (h: number) => new Date(now + h * 3_600_000);
const daysAgo = (d: number) => new Date(now - d * 86_400_000);
const inDays = (d: number) => new Date(now + d * 86_400_000);

async function createDemoUser(name: string, email: string): Promise<string> {
  const res = await auth.api.signUpEmail({ body: { name, email, password: DEMO_PASSWORD } });
  return res.user.id;
}

async function main() {
  console.log('Seeding Blood Bridge database...');

  // 1. Remove previous demo users; FK cascades clean up everything they own.
  const demoUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, '%@bloodbridge.demo'));
  if (demoUsers.length > 0) {
    await db.delete(user).where(
      inArray(
        user.id,
        demoUsers.map((u) => u.id),
      ),
    );
    console.log(`Removed ${demoUsers.length} previous demo users`);
  }

  // 2. Global content. Centers are upserted (appointments reference them);
  //    announcements/articles have no inbound FKs, so replace wholesale.
  const centers = [
    {
      id: 'ctr-1',
      name: 'Central Blood Services',
      kind: 'blood_bank',
      address: '210 Market St',
      city: 'Downtown',
      distanceKm: 1.2,
      openNow: true,
      hours: '8:00 AM – 6:00 PM',
      rating: 4.8,
      needsUrgent: ['O-', 'O+'],
    },
    {
      id: 'ctr-2',
      name: 'St. Mary Medical Center',
      kind: 'hospital',
      address: '54 Cathedral Ave',
      city: 'Downtown',
      distanceKm: 2.3,
      openNow: true,
      hours: '24 hours',
      rating: 4.6,
      needsUrgent: ['O-'],
    },
    {
      id: 'ctr-3',
      name: 'Riverside Community Drive',
      kind: 'campaign',
      address: 'Riverside Park Pavilion',
      city: 'Riverside',
      distanceKm: 5.8,
      openNow: false,
      hours: 'Sat 9:00 AM – 3:00 PM',
      rating: 4.9,
      needsUrgent: null,
    },
    {
      id: 'ctr-4',
      name: 'Lakeside Blood Bank',
      kind: 'blood_bank',
      address: '900 Lakeshore Blvd',
      city: 'Lakeside',
      distanceKm: 8.1,
      openNow: true,
      hours: '9:00 AM – 5:00 PM',
      rating: 4.5,
      needsUrgent: ['AB-', 'B+'],
    },
  ] as const;
  for (const center of centers) {
    const { id, ...rest } = center;
    await db
      .insert(donationCenters)
      .values(center as typeof donationCenters.$inferInsert)
      .onConflictDoUpdate({
        target: donationCenters.id,
        set: rest as Partial<typeof donationCenters.$inferInsert>,
      });
  }

  await db.delete(announcements);
  await db.insert(announcements).values([
    {
      title: 'Critical O− shortage citywide',
      body: 'Reserves are below a two-day supply. If you are eligible, your donation this week has outsized impact.',
      tag: 'Urgent',
      date: hoursAgo(2),
      tone: 'brand',
    },
    {
      title: 'Weekend community drive',
      body: 'Riverside Park pavilion, Saturday 9–3. Walk-ins welcome, refreshments provided.',
      tag: 'Event',
      date: hoursAgo(20),
      tone: 'info',
    },
    {
      title: 'New: reschedule from your card',
      body: 'You can now manage appointments directly from your digital donor card.',
      tag: 'Product',
      date: daysAgo(2),
      tone: 'success',
    },
  ]);

  await db.delete(educationArticles);
  await db.insert(educationArticles).values([
    {
      title: 'Are you eligible to donate?',
      summary: 'A quick check of the most common eligibility criteria.',
      minutes: 3,
      category: 'eligibility',
      icon: 'checkmark-circle',
      body: [
        'Most healthy adults aged 17 and older who weigh at least 50 kg (110 lb) can donate whole blood.',
        'You should feel well on the day of your donation and be free of cold or flu symptoms.',
        'There is a standard waiting period of 56 days between whole-blood donations so your body can replenish red cells.',
        'Certain medications, recent travel, or tattoos may require a short deferral. When in doubt, the donation center will screen you.',
      ],
    },
    {
      title: 'What happens during a donation',
      summary: 'From check-in to cookies — the whole process, step by step.',
      minutes: 4,
      category: 'process',
      icon: 'medkit',
      body: [
        'Registration and a brief health questionnaire take about 10 minutes.',
        'A quick finger-prick checks your hemoglobin level.',
        'The donation itself usually takes 8–10 minutes for whole blood.',
        'You will rest and enjoy a snack for 10–15 minutes afterward. The entire visit is about an hour.',
      ],
    },
    {
      title: 'Eating and hydration tips',
      summary: 'How to feel your best before and after giving.',
      minutes: 2,
      category: 'health',
      icon: 'nutrition',
      body: [
        'Drink an extra 500 ml of water in the hours before you donate.',
        'Eat an iron-rich meal and avoid fatty foods beforehand.',
        'Keep the bandage on for a few hours and avoid heavy lifting for the rest of the day.',
      ],
    },
    {
      title: 'Myths about blood donation',
      summary: 'Separating common fears from the facts.',
      minutes: 3,
      category: 'myths',
      icon: 'sparkles',
      body: [
        'Myth: Donating makes you weak. In reality your body replaces the fluid within 24 hours.',
        'Myth: It is painful. Most donors feel only a brief pinch.',
        'Myth: You cannot donate if you have a tattoo. In most regions you can after a short waiting period.',
      ],
    },
  ]);

  // 3. Demo users — created through Better Auth so password hashes are real.
  const amara = await createDemoUser('Amara Okafor', 'amara@bloodbridge.demo');
  const daniel = await createDemoUser('Daniel Cho', 'daniel@bloodbridge.demo');
  const liam = await createDemoUser('Liam Nguyen', 'liam@bloodbridge.demo');
  console.log('Created demo users:', { amara, daniel, liam });

  await db.insert(profiles).values([
    {
      userId: amara,
      bloodType: 'A+',
      phone: '+1 555 0161',
      city: 'Downtown',
      avatarColor: '#EC4899',
      weightKg: 64,
      lastDonationDate: daysAgo(78), // past the 56-day cooldown → eligible
    },
    {
      userId: daniel,
      bloodType: 'A+',
      phone: '+1 555 0114',
      city: 'Riverside',
      avatarColor: '#3B82F6',
      weightKg: 78,
      lastDonationDate: daysAgo(40), // still cooling down
    },
    {
      userId: liam,
      bloodType: 'A-',
      phone: '+1 555 0187',
      city: 'Midtown',
      avatarColor: '#10B981',
      weightKg: 71,
      lastDonationDate: daysAgo(200),
    },
  ]);

  // 4. Emergency requests. unitsFulfilled stays consistent with confirmed
  //    responder rows (0 unless the owner marked the request fulfilled).
  await db.insert(emergencyRequests).values([
    {
      id: 'req_seed_kl',
      ownerId: amara,
      patientInitials: 'K.L.',
      bloodType: 'A+',
      unitsNeeded: 2,
      urgency: 'urgent',
      hospital: 'Riverside General',
      city: 'Riverside',
      distanceKm: 5.8,
      neededBy: inHours(20),
      postedAt: hoursAgo(2),
      contactName: 'Amara Okafor',
      contactPhone: '+1 555 0161',
      note: 'Posted on behalf of a family member ahead of surgery.',
      status: 'open',
    },
    {
      id: 'req_seed_sm',
      ownerId: daniel,
      patientInitials: 'S.M.',
      bloodType: 'O-',
      unitsNeeded: 4,
      urgency: 'critical',
      hospital: 'St. Mary Medical Center',
      city: 'Downtown',
      distanceKm: 2.3,
      neededBy: inHours(6),
      postedAt: hoursAgo(1),
      contactName: 'Dr. Alan Reyes',
      contactPhone: '+1 555 0142',
      note: 'Trauma patient in surgery. Universal donor urgently needed.',
      status: 'open',
    },
    {
      id: 'req_seed_jk',
      ownerId: liam,
      patientInitials: 'J.K.',
      bloodType: 'A+',
      unitsNeeded: 2,
      urgency: 'urgent',
      hospital: 'Riverside General',
      city: 'Riverside',
      distanceKm: 5.8,
      neededBy: inHours(24),
      postedAt: hoursAgo(3),
      contactName: 'Nurse Priya Shah',
      contactPhone: '+1 555 0198',
      note: 'Scheduled surgery tomorrow morning.',
      status: 'open',
    },
    {
      id: 'req_seed_mt',
      ownerId: amara,
      patientInitials: 'M.T.',
      bloodType: 'B+',
      unitsNeeded: 3,
      urgency: 'moderate',
      hospital: 'Lakeside Children’s Hospital',
      city: 'Lakeside',
      distanceKm: 8.1,
      neededBy: inDays(2),
      postedAt: hoursAgo(9),
      contactName: 'Dr. Lena Osei',
      contactPhone: '+1 555 0173',
      note: 'Pediatric patient, ongoing treatment.',
      status: 'open',
    },
    {
      id: 'req_seed_rd',
      ownerId: daniel,
      patientInitials: 'R.D.',
      bloodType: 'AB-',
      unitsNeeded: 1,
      urgency: 'urgent',
      hospital: 'Hope Cancer Institute',
      city: 'Midtown',
      distanceKm: 3.7,
      neededBy: inHours(18),
      postedAt: hoursAgo(5),
      contactName: 'Coordinator Tomás Vidal',
      contactPhone: '+1 555 0110',
      note: 'Rare type needed for platelet support.',
      status: 'open',
    },
    {
      id: 'req_seed_ec',
      ownerId: liam,
      patientInitials: 'E.C.',
      bloodType: 'O+',
      unitsNeeded: 6,
      unitsFulfilled: 6,
      urgency: 'routine',
      hospital: 'Central Blood Services',
      city: 'Downtown',
      distanceKm: 1.2,
      neededBy: inDays(4),
      postedAt: daysAgo(1),
      contactName: 'Intake Desk',
      contactPhone: '+1 555 0100',
      note: 'Inventory replenishment drive.',
      status: 'fulfilled',
    },
  ]);

  await db.insert(responders).values([
    // Amara's K.L. request: two compatible donors have offered.
    { requestId: 'req_seed_kl', userId: daniel, respondedAt: hoursAgo(1) },
    { requestId: 'req_seed_kl', userId: liam, respondedAt: hoursAgo(4) },
    // Liam's J.K. request: Amara has offered.
    { requestId: 'req_seed_jk', userId: amara, respondedAt: hoursAgo(2) },
  ]);

  // 5. Donation history (drives eligibility + impact stats per user).
  await db.insert(donations).values([
    { userId: amara, date: daysAgo(78), centerName: 'Central Blood Services', city: 'Downtown', units: 1, type: 'whole' },
    { userId: amara, date: daysAgo(150), centerName: 'St. Mary Medical Center', city: 'Downtown', units: 1, type: 'power_red' },
    { userId: amara, date: daysAgo(224), centerName: 'Riverside Community Drive', city: 'Riverside', units: 1, type: 'whole' },
    { userId: amara, date: daysAgo(300), centerName: 'Central Blood Services', city: 'Downtown', units: 1, type: 'plasma' },
    { userId: amara, date: daysAgo(372), centerName: 'Lakeside Blood Bank', city: 'Lakeside', units: 1, type: 'whole' },
    { userId: daniel, date: daysAgo(40), centerName: 'Central Blood Services', city: 'Downtown', units: 1, type: 'whole' },
    { userId: daniel, date: daysAgo(130), centerName: 'St. Mary Medical Center', city: 'Downtown', units: 1, type: 'whole' },
    { userId: liam, date: daysAgo(200), centerName: 'Lakeside Blood Bank', city: 'Lakeside', units: 1, type: 'whole' },
  ]);

  // 6. One upcoming appointment for Amara.
  await db.insert(appointments).values({
    userId: amara,
    centerId: 'ctr-1',
    date: inDays(3),
    status: 'confirmed',
    type: 'whole',
  });

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
