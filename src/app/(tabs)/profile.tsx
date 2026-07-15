/**
 * Profile & settings. Identity header, donor summary, quick links, appearance,
 * and sign-out. See design.md §Profile.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  BloodTypeGlyph,
  Card,
  ConfirmSheet,
  FadeIn,
  ScreenHeader,
  useToast,
} from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { UNIVERSAL_DONOR } from '@/lib/blood';
import { useAppStore } from '@/store/app-store';

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress?: () => void;
};

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { profile, donations, signOut } = useAppStore();
  const [confirmOut, setConfirmOut] = useState(false);

  if (!profile) return null;

  const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);

  const account: Row[] = [
    {
      icon: 'person-outline',
      label: 'Personal information',
      detail: profile.email,
      onPress: () => router.push('/profile-setup'),
    },
    {
      icon: 'water-outline',
      label: 'Blood type',
      detail: profile.bloodType + (profile.bloodType === UNIVERSAL_DONOR ? ' · Universal' : ''),
    },
    {
      icon: 'location-outline',
      label: 'Location',
      detail: profile.city,
    },
    {
      icon: 'card-outline',
      label: 'Digital donor card',
      onPress: () => router.push('/donor-card'),
    },
  ];

  const preferences: Row[] = [
    { icon: 'notifications-outline', label: 'Notifications', detail: 'On' },
    { icon: 'shield-checkmark-outline', label: 'Privacy', detail: 'Standard' },
    { icon: 'moon-outline', label: 'Appearance', detail: 'System' },
    {
      icon: 'help-circle-outline',
      label: 'Help & support',
      onPress: () => toast.show('Support is a tap away — coming soon', 'info'),
    },
  ];

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Profile" large={false} />

        <FadeIn>
          <Card style={styles.identity}>
            <Avatar name={profile.fullName} size={64} />
            <View style={styles.identityText}>
              <ThemedText type="title2">{profile.fullName}</ThemedText>
              <ThemedText type="subhead" color="textSecondary">
                {profile.isDonor ? 'Registered donor' : 'Member'} · {donations.length} donations
              </ThemedText>
            </View>
            <BloodTypeGlyph type={profile.bloodType} size="sm" filled />
          </Card>
        </FadeIn>

        <FadeIn delay={60}>
          <View style={styles.summary}>
            <SummaryStat value={String(donations.length)} label="Donations" />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryStat value={String(totalUnits)} label="Units given" />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryStat value={String(totalUnits * 3)} label="Lives touched" />
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <Section title="Account">
            {account.map((row, i) => (
              <SettingRow key={row.label} row={row} last={i === account.length - 1} />
            ))}
          </Section>
        </FadeIn>

        <FadeIn delay={180}>
          <Section title="Preferences">
            {preferences.map((row, i) => (
              <SettingRow key={row.label} row={row} last={i === preferences.length - 1} />
            ))}
          </Section>
        </FadeIn>

        <FadeIn delay={240}>
          <PressableScale
            haptic="medium"
            onPress={() => setConfirmOut(true)}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={[styles.signOut, { borderColor: theme.border }]}>
            <Ionicons name="log-out-outline" size={18} color={theme.danger} />
            <ThemedText type="bodyStrong" color="danger">
              Sign out
            </ThemedText>
          </PressableScale>
        </FadeIn>

        <ThemedText type="caption" color="textTertiary" style={styles.version}>
          Vesta · v1.0.0
        </ThemedText>
      </ScrollView>

      <ConfirmSheet
        visible={confirmOut}
        title="Sign out?"
        message="Your data stays on this device. You can sign back in anytime."
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirmOut(false)}
        onConfirm={async () => {
          setConfirmOut(false);
          await signOut();
          router.replace('/(auth)/sign-in');
        }}
      />
    </View>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryStat}>
      <ThemedText type="title2">{value}</ThemedText>
      <ThemedText type="footnote" color="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="footnote" color="textTertiary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      <Card padding={0} style={styles.sectionCard}>
        {children}
      </Card>
    </View>
  );
}

function SettingRow({ row, last }: { row: Row; last: boolean }) {
  const theme = useTheme();
  return (
    <PressableScale
      scaleTo={0.99}
      onPress={row.onPress}
      disabled={!row.onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={row.label}
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.surfaceSunken }]}>
        <Ionicons name={row.icon} size={18} color={theme.textSecondary} />
      </View>
      <ThemedText type="body" style={styles.rowLabel}>
        {row.label}
      </ThemedText>
      {row.detail ? (
        <ThemedText type="subhead" color="textTertiary" numberOfLines={1} style={styles.rowDetail}>
          {row.detail}
        </ThemedText>
      ) : null}
      {row.onPress ? (
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.base, gap: Spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  identityText: { flex: 1, gap: 2 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryStat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 36 },
  section: { gap: Spacing.sm },
  sectionTitle: { marginLeft: Spacing.xs, letterSpacing: 0.6 },
  sectionCard: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1 },
  rowDetail: { maxWidth: 140, textAlign: 'right' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  version: { textAlign: 'center', letterSpacing: 0.4 },
});
