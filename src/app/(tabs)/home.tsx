/**
 * Home dashboard. Personal greeting, eligibility ring, blood type, quick
 * actions, nearby emergencies, appointments, centers, announcements.
 * The centerpiece screen — see design.md §Home.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RequestCard } from '@/components/request-card';
import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  Badge,
  BloodTypeGlyph,
  Card,
  FadeIn,
  ProgressRing,
} from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeEligibility } from '@/lib/blood';
import { distanceLabel, firstName, greeting, longDate, relativeTime, shortDate } from '@/lib/format';
import { mockAnnouncements, mockCenters } from '@/data/mock';
import { useAppStore } from '@/store/app-store';

const QUICK_ACTIONS = [
  { key: 'donate', label: 'Donate', icon: 'water' as const, tint: 'brand' as const, href: '/book' as const },
  { key: 'request', label: 'Request', icon: 'add-circle' as const, tint: 'info' as const, href: '/request/new' as const },
  { key: 'card', label: 'Donor Card', icon: 'qr-code' as const, tint: 'success' as const, href: '/donor-card' as const },
  { key: 'centers', label: 'Find Banks', icon: 'location' as const, tint: 'warning' as const, href: '/book' as const },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, requests, appointments, donations } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const eligibility = useMemo(
    () => computeEligibility(profile?.lastDonationDate),
    [profile?.lastDonationDate],
  );

  const compatibleRequests = useMemo(() => {
    if (!profile) return [];
    return requests
      .filter((r) => (r.status === 'open' || r.status === 'partial') && r.ownerId !== profile.id)
      .slice(0, 3);
  }, [requests, profile]);

  const myActiveRequests = useMemo(() => {
    if (!profile) return [];
    return requests.filter(
      (r) => r.ownerId === profile.id && (r.status === 'open' || r.status === 'partial'),
    );
  }, [requests, profile]);

  const nextAppointment = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'confirmed' || a.status === 'pending')
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0],
    [appointments],
  );

  const nearestCenter = mockCenters[0] ?? null;
  const unitsGiven = donations.reduce((sum, d) => sum + d.units, 0);
  const lastDonation = useMemo(
    () =>
      donations
        .slice()
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0],
    [donations],
  );

  if (!profile) return null;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textTertiary} />
      }>
      {/* Greeting */}
      <FadeIn>
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <View style={styles.brandLine}>
              <View style={[styles.brandMark, { backgroundColor: theme.brandSubtle }]}>
                <Ionicons name="water" size={13} color={theme.brand} />
              </View>
              <ThemedText type="caption" color="brand" style={styles.brandWordmark}>
                VESTA
              </ThemedText>
            </View>
            <ThemedText type="title">{greeting()}, {firstName(profile.fullName)}</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <PressableScale
              onPress={() => router.push('/(tabs)/feed')}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={
                compatibleRequests.length > 0
                  ? `Open emergency feed, ${compatibleRequests.length} requests need your type`
                  : 'Open emergency feed'
              }
              style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="notifications-outline" size={21} color={theme.text} />
              {compatibleRequests.length > 0 ? (
                <View style={[styles.notificationDot, { backgroundColor: theme.brand, borderColor: theme.surface }]} />
              ) : null}
            </PressableScale>
            <PressableScale onPress={() => router.push('/(tabs)/profile')} accessibilityLabel="Your profile">
              <Avatar name={profile.fullName} color={profile.avatarColor} size={44} />
            </PressableScale>
          </View>
        </View>
      </FadeIn>

      {/* Eligibility hero */}
      <FadeIn delay={60}>
        <View style={[styles.hero, { backgroundColor: theme.brandDeep }]}>
          <View pointerEvents="none" style={[styles.heroOrb, { backgroundColor: theme.brandStrong }]} />
          <View pointerEvents="none" style={[styles.heroRing, { borderColor: theme.brand }]} />
          <View style={styles.heroLeft}>
            <View style={styles.heroEyebrow}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: eligibility.eligible ? theme.success : theme.warning },
                ]}
              />
              <ThemedText type="footnote" style={styles.heroEyebrowText}>
                {eligibility.eligible ? 'Eligible to donate' : 'In your donation cycle'}
              </ThemedText>
            </View>
            <ThemedText type="title2" style={[styles.heroTitle, { color: theme.onColor }]}>
              {eligibility.eligible ? 'Your next good thing' : `Ready in ${eligibility.daysRemaining} days`}
            </ThemedText>
            <ThemedText type="footnote" style={styles.heroSub}>
              {eligibility.eligible
                ? 'You are eligible to donate. A nearby appointment is waiting.'
                : `Next eligible ${shortDate(eligibility.nextEligibleDate.toISOString())}`}
            </ThemedText>
            {eligibility.eligible ? (
              <PressableScale
                onPress={() => router.push('/book')}
                haptic="medium"
                accessibilityRole="button"
                accessibilityLabel="Book a donation"
                style={[styles.heroCta, { backgroundColor: theme.brand }]}>
                <ThemedText type="subhead" style={[styles.heroCtaText, { color: theme.onBrand }]}>Book a donation</ThemedText>
                <Ionicons name="arrow-forward" size={17} color={theme.onBrand} />
              </PressableScale>
            ) : (
              <PressableScale
                onPress={() => router.push('/(tabs)/donor')}
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel="Track your donation cycle"
                style={[styles.heroCtaGhost, { borderColor: 'rgba(255,255,255,0.24)' }]}>
                <ThemedText type="subhead" style={[styles.heroCtaText, { color: theme.onColor }]}>Track your cycle</ThemedText>
                <Ionicons name="arrow-forward" size={17} color={theme.onColor} />
              </PressableScale>
            )}
          </View>
          <View style={styles.heroRingWrap}>
            <ProgressRing
              progress={eligibility.progress}
              size={94}
              strokeWidth={8}
              color={theme.brand}
              trackColor="rgba(255,255,255,0.22)"
              accessibilityLabel={
                eligibility.eligible
                  ? 'Donation cycle complete, you are eligible'
                  : `Donation cycle ${Math.round(eligibility.progress * 100)} percent complete`
              }>
              <BloodTypeGlyph type={profile.bloodType} size="lg" onDark />
            </ProgressRing>
            <ThemedText type="caption" style={styles.cycleLabel}>56-day cycle</ThemedText>
          </View>
        </View>
      </FadeIn>

      {/* Tier 1 — Needs you now: urgent compatible requests surfaced right under the hero */}
      {compatibleRequests.length > 0 ? (
        <FadeIn delay={120}>
          <SectionHeader
            title="People need your type"
            actionLabel="View feed"
            onAction={() => router.push('/(tabs)/feed')}
          />
          <View style={styles.stack}>
            {compatibleRequests.slice(0, 2).map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                viewerType={profile.bloodType}
                viewerId={profile.id}
                onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })}
              />
            ))}
          </View>
        </FadeIn>
      ) : null}

      {/* Your active requests — things the donor owns and needs to track */}
      {myActiveRequests.length > 0 ? (
        <FadeIn delay={160}>
          <SectionHeader title="Your requests" />
          <View style={styles.stack}>
            {myActiveRequests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                viewerType={profile.bloodType}
                viewerId={profile.id}
                onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })}
              />
            ))}
          </View>
        </FadeIn>
      ) : null}

      {/* Next appointment — an upcoming commitment */}
      {nextAppointment ? (
        <FadeIn delay={200}>
          <SectionHeader title="Your next appointment" actionLabel="Manage" onAction={() => router.push('/(tabs)/donor')} />
          <Card onPress={() => router.push('/(tabs)/donor')} variant="tinted" tint={theme.infoSubtle}>
            <View style={styles.aptRow}>
              <View style={[styles.dateBadge, { backgroundColor: theme.surface }]}>
                <ThemedText type="caption" color="brand">{new Date(nextAppointment.date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</ThemedText>
                <ThemedText type="title2" color="brand">{new Date(nextAppointment.date).getDate()}</ThemedText>
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

      {/* Tier 2 — Explore: shortcuts and nearby options, separated from the urgent tier */}
      <FadeIn delay={240} style={styles.tierBreak}>
        <View style={styles.sectionHeader}>
          <ThemedText type="headline">Make a difference</ThemedText>
          <ThemedText type="footnote" color="textSecondary">Choose your next step</ThemedText>
        </View>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <PressableScale
              key={a.key}
              onPress={() => router.push(a.href)}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={[styles.action, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.actionTopRow}>
                <View style={[styles.actionIcon, { backgroundColor: theme[`${a.tint}Subtle`] }]}>
                  <Ionicons name={a.icon} size={21} color={theme[a.tint]} />
                </View>
                <Ionicons name="arrow-forward-outline" size={17} color={theme.textTertiary} />
              </View>
              <ThemedText type="bodyStrong" style={styles.actionLabel}>
                {a.label}
              </ThemedText>
              <ThemedText type="caption" color="textTertiary">
                {a.key === 'donate' ? 'Book a visit' : a.key === 'request' ? 'Ask for help' : a.key === 'card' ? 'Always ready' : 'Near you'}
              </ThemedText>
            </PressableScale>
          ))}
        </View>
      </FadeIn>

      {/* Nearby center */}
      {nearestCenter ? (
        <FadeIn delay={280}>
          <SectionHeader title="Nearby donation center" />
          <Card onPress={() => router.push('/book')}>
            <View style={styles.centerRow}>
              <View style={[styles.aptIcon, { backgroundColor: theme.infoSubtle }]}>
                <Ionicons name="business" size={22} color={theme.info} />
              </View>
              <View style={styles.aptBody}>
                <ThemedText type="bodyStrong">{nearestCenter.name}</ThemedText>
                <ThemedText type="footnote" color="textSecondary">
                  {distanceLabel(nearestCenter.distanceKm)} · {nearestCenter.openNow ? 'Open now' : 'Closed'} · {nearestCenter.hours}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </View>
          </Card>
        </FadeIn>
      ) : null}

      {/* Announcements */}
      <FadeIn delay={320}>
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

      {/* Tier 3 — Reflection: impact lives at the bottom, a quiet coda, not a competing headline */}
      <FadeIn delay={360} style={styles.tierBreak}>
        <Card style={styles.impactCard} padding="base">
          <View style={styles.impactHeader}>
            <View style={styles.impactHeadText}>
              <ThemedText type="headline">Your impact</ThemedText>
              <ThemedText type="footnote" color="textSecondary">
                {donations.length > 0
                  ? `Your last donation was ${shortDate(lastDonation.date)}`
                  : 'Your first donation helps up to three people'}
              </ThemedText>
            </View>
            <View style={[styles.impactIcon, { backgroundColor: theme.successSubtle }]}>
              <Ionicons name="heart" size={18} color={theme.success} />
            </View>
          </View>
          {donations.length > 0 ? (
            <View style={styles.impactStats}>
              <ImpactStat value={String(donations.length)} label={donations.length === 1 ? 'donation' : 'donations'} color={theme.brand} />
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <ImpactStat value={String(unitsGiven)} label={unitsGiven === 1 ? 'unit given' : 'units given'} color={theme.success} />
            </View>
          ) : null}
        </Card>
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

function ImpactStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.impactStat}>
      <ThemedText type="title2" style={{ color }}>{value}</ThemedText>
      <ThemedText type="caption" color="textTertiary">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  // Generous separation at tier boundaries (Needs-you → Explore → Reflection):
  // base gap (16) within a tier, +base marginTop (16) at a break = 32, a clean
  // 2:1 rhythm that groups related sections and separates distinct ones.
  tierBreak: { marginTop: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingBlock: { gap: Spacing.xs, flex: 1 },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandMark: { width: 24, height: 24, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  brandWordmark: { letterSpacing: 1.2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconButton: { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3, borderWidth: 1.5 },
  hero: {
    minHeight: 238,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroLeft: { flex: 1, gap: Spacing.sm, alignItems: 'flex-start', zIndex: 1 },
  heroOrb: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -84, top: -60, opacity: 0.24 },
  heroRing: { position: 'absolute', width: 250, height: 250, borderRadius: 125, right: -102, top: -78, borderWidth: 1, opacity: 0.34 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  heroEyebrowText: { color: 'rgba(255,255,255,0.82)' },
  heroTitle: {},
  heroSub: { color: 'rgba(255,255,255,0.85)' },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  heroCtaGhost: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.full, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  heroCtaText: {},
  heroRingWrap: { alignItems: 'center', gap: Spacing.sm, zIndex: 1 },
  cycleLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 0 },
  impactCard: { gap: Spacing.base },
  impactHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  impactHeadText: { flex: 1, gap: Spacing.xs },
  impactIcon: { width: 36, height: 36, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  impactStats: { flexDirection: 'row', alignItems: 'center' },
  impactStat: { flex: 1, gap: Spacing.xs },
  statDivider: { width: StyleSheet.hairlineWidth, height: 34 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md },
  action: { width: '48%', minHeight: 116, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md, gap: Spacing.sm },
  actionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { marginTop: 'auto' },
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
  dateBadge: { width: 52, height: 58, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: 0 },
  aptBody: { flex: 1, gap: 2 },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  annRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  annTitle: { marginBottom: Spacing.xs },
});
