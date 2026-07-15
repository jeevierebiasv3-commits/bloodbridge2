/**
 * Home dashboard. Personal greeting, eligibility ring, blood type, quick
 * actions, nearby emergencies, appointments, centers, announcements.
 * The centerpiece screen — see design.md §Home.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RequestCard } from '@/components/request-card';
import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  Badge,
  BloodTypeGlyph,
  Card,
  FadeIn,
  Gradient,
  ProgressRing,
  StatTile,
} from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { BrandGradient, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeEligibility } from '@/lib/blood';
import { firstName, greeting, longDate, relativeTime, shortDate } from '@/lib/format';
import { mockAnnouncements, mockCenters } from '@/data/mock';
import { useAppStore } from '@/store/app-store';

const QUICK_ACTIONS = [
  { key: 'donate', label: 'Donate', icon: 'water' as const, tint: 'brand' as const, href: '/book' as const },
  { key: 'request', label: 'Request', icon: 'add-circle' as const, tint: 'info' as const, href: '/request/new' as const },
  { key: 'card', label: 'Donor Card', icon: 'qr-code' as const, tint: 'success' as const, href: '/donor-card' as const },
  { key: 'centers', label: 'Find Banks', icon: 'location' as const, tint: 'warning' as const, href: '/(tabs)/feed' as const },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, requests, appointments, donations } = useAppStore();

  const eligibility = useMemo(
    () => computeEligibility(profile?.lastDonationDate),
    [profile?.lastDonationDate],
  );

  const compatibleRequests = useMemo(() => {
    if (!profile) return [];
    return requests
      .filter((r) => r.status === 'open' || r.status === 'partial')
      .slice(0, 3);
  }, [requests, profile]);

  const nextAppointment = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'confirmed' || a.status === 'pending')
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0],
    [appointments],
  );

  const nearestCenter = mockCenters[0];
  const livesSaved = donations.reduce((sum, d) => sum + d.units, 0) * 3;

  if (!profile) return null;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <FadeIn>
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <ThemedText type="callout" color="textSecondary">
              {greeting()}
            </ThemedText>
            <ThemedText type="title">{firstName(profile.fullName)}</ThemedText>
          </View>
          <PressableScale onPress={() => router.push('/(tabs)/profile')} accessibilityLabel="Your profile">
            <Avatar name={profile.fullName} color={profile.avatarColor} size={48} />
          </PressableScale>
        </View>
      </FadeIn>

      {/* Eligibility hero */}
      <FadeIn delay={60}>
        <Gradient colors={BrandGradient} style={styles.hero}>
          <View style={styles.heroLeft}>
            <Badge
              label={eligibility.eligible ? 'Eligible to donate' : 'Recovering'}
              tone={eligibility.eligible ? 'success' : 'warning'}
            />
            <ThemedText type="title2" style={styles.heroTitle}>
              {eligibility.eligible
                ? 'You can save a life today'
                : `Ready in ${eligibility.daysRemaining} days`}
            </ThemedText>
            <ThemedText type="footnote" style={styles.heroSub}>
              {eligibility.eligible
                ? 'Your next donation is due. Book a slot near you.'
                : `Next eligible ${shortDate(eligibility.nextEligibleDate.toISOString())}`}
            </ThemedText>
          </View>
          <ProgressRing
            progress={eligibility.progress}
            size={92}
            strokeWidth={8}
            color="#FFFFFF"
            trackColor="rgba(255,255,255,0.25)">
            <BloodTypeGlyph type={profile.bloodType} size="lg" onDark />
          </ProgressRing>
        </Gradient>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={120}>
        <View style={styles.statsRow}>
          <StatTile label="Donations" value={String(donations.length)} icon="water" tint="brand" />
          <StatTile label="Lives touched" value={String(livesSaved)} icon="heart" tint="success" />
          <StatTile
            label="Blood type"
            value={profile.bloodType}
            icon="fitness"
            tint="info"
          />
        </View>
      </FadeIn>

      {/* Quick actions */}
      <FadeIn delay={180}>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <PressableScale
              key={a.key}
              onPress={() => router.push(a.href)}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={styles.action}>
              <View style={[styles.actionIcon, { backgroundColor: theme[`${a.tint}Subtle`] }]}>
                <Ionicons name={a.icon} size={24} color={theme[a.tint]} />
              </View>
              <ThemedText type="footnote" color="textSecondary" style={styles.actionLabel}>
                {a.label}
              </ThemedText>
            </PressableScale>
          ))}
        </View>
      </FadeIn>

      {/* Next appointment */}
      {nextAppointment ? (
        <FadeIn delay={220}>
          <SectionHeader title="Upcoming appointment" />
          <Card onPress={() => router.push('/(tabs)/donor')}>
            <View style={styles.aptRow}>
              <View style={[styles.aptIcon, { backgroundColor: theme.brandSubtle }]}>
                <Ionicons name="calendar" size={22} color={theme.brand} />
              </View>
              <View style={styles.aptBody}>
                <ThemedText type="bodyStrong">{nextAppointment.centerName}</ThemedText>
                <ThemedText type="footnote" color="textSecondary">
                  {longDate(nextAppointment.date)}
                </ThemedText>
              </View>
              <Badge
                label={nextAppointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                tone={nextAppointment.status === 'confirmed' ? 'success' : 'warning'}
              />
            </View>
          </Card>
        </FadeIn>
      ) : null}

      {/* Emergency feed */}
      <FadeIn delay={260}>
        <SectionHeader
          title="Nearby emergencies"
          actionLabel="See all"
          onAction={() => router.push('/(tabs)/feed')}
        />
        <View style={styles.stack}>
          {compatibleRequests.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              viewerType={profile.bloodType}
              onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })}
            />
          ))}
        </View>
      </FadeIn>

      {/* Nearby center */}
      <FadeIn delay={300}>
        <SectionHeader title="Nearby donation center" />
        <Card onPress={() => router.push('/book')}>
          <View style={styles.centerRow}>
            <View style={[styles.aptIcon, { backgroundColor: theme.infoSubtle }]}>
              <Ionicons name="business" size={22} color={theme.info} />
            </View>
            <View style={styles.aptBody}>
              <ThemedText type="bodyStrong">{nearestCenter.name}</ThemedText>
              <ThemedText type="footnote" color="textSecondary">
                {nearestCenter.distanceKm} km · {nearestCenter.openNow ? 'Open now' : 'Closed'} · {nearestCenter.hours}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </View>
        </Card>
      </FadeIn>

      {/* Announcements */}
      <FadeIn delay={340}>
        <SectionHeader title="Announcements" />
        <View style={styles.stack}>
          {mockAnnouncements.slice(0, 2).map((a) => (
            <Card key={a.id} variant="outline">
              <View style={styles.annRow}>
                <Badge label={a.tag} tone={a.tone === 'brand' ? 'brand' : a.tone} />
                <ThemedText type="caption" color="textTertiary">
                  {relativeTime(a.date)}
                </ThemedText>
              </View>
              <ThemedText type="bodyStrong" style={styles.annTitle}>
                {a.title}
              </ThemedText>
              <ThemedText type="footnote" color="textSecondary">
                {a.body}
              </ThemedText>
            </Card>
          ))}
        </View>
      </FadeIn>
    </ScrollView>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="headline">{title}</ThemedText>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <ThemedText type="subhead" color="brand">
            {actionLabel}
          </ThemedText>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingBlock: { gap: 2 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  heroLeft: { flex: 1, gap: Spacing.sm, alignItems: 'flex-start' },
  heroTitle: { color: '#FFFFFF' },
  heroSub: { color: 'rgba(255,255,255,0.85)' },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  action: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stack: { gap: Spacing.md },
  aptRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  aptIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptBody: { flex: 1, gap: 2 },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  annRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  annTitle: { marginBottom: Spacing.xs },
});
