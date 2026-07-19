/**
 * Book donation appointment (modal). Pick a center, day, and time slot, then
 * confirm. Persists to the store and lands a success toast. See design.md
 * §Appointments, §8 States.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Card, FadeIn, ScreenHeader, useToast } from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useBookAppointment, useCenters } from '@/hooks/api';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import type { Donation } from '@/types/domain';

const SLOTS = ['08:30', '09:15', '10:00', '11:30', '13:00', '14:45', '16:00'];

type DonationType = Donation['type'];

const DONATION_TYPES: {
  value: DonationType;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'whole', label: 'Whole blood', detail: 'The most common donation', icon: 'water' },
  { value: 'plasma', label: 'Plasma', detail: 'Cells returned to you', icon: 'flask' },
  { value: 'platelets', label: 'Platelets', detail: 'For cancer & surgery care', icon: 'shield-half' },
  { value: 'power_red', label: 'Power Red', detail: 'Two units of red cells', icon: 'water' },
];

function nextDays(count: number): { iso: string; label: string; dow: string }[] {
  const out: { iso: string; label: string; dow: string }[] = [];
  const base = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      iso: d.toISOString(),
      label: String(d.getDate()),
      dow: d.toLocaleDateString(undefined, { weekday: 'short' }),
    });
  }
  return out;
}

export default function BookScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { data: centers = [] } = useCenters();
  const bookAppointment = useBookAppointment();

  const days = useMemo(() => nextDays(10), []);
  const [centerId, setCenterId] = useState('');
  const [type, setType] = useState<DonationType>('whole');
  const [dayIso, setDayIso] = useState(days[1]?.iso ?? days[0].iso);
  const [slot, setSlot] = useState<string | null>(null);

  // Default the selection to the first center once the list loads.
  const center = centers.find((c) => c.id === centerId) ?? centers[0];
  const canConfirm = Boolean(center && slot && !bookAppointment.isPending);

  const confirm = async () => {
    if (!center || !slot || bookAppointment.isPending) {
      if (!center || !slot) haptics.error();
      return;
    }
    const [h, m] = slot.split(':').map(Number);
    const when = new Date(dayIso);
    when.setHours(h, m, 0, 0);
    try {
      await bookAppointment.mutateAsync({
        centerId: center.id,
        date: when.toISOString(),
        type,
      });
      haptics.success();
      toast.show('Appointment confirmed', 'success');
      router.back();
    } catch {
      haptics.error();
      toast.show('Could not book the appointment. Please try again.', 'danger');
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing['4xl'] + Spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Book donation"
        subtitle="Choose a center and time that works for you"
        showBack
        onBack={() => router.back()}
        large={false}
      />

      {/* Center selection */}
      <FadeIn>
        <ThemedText type="headline" style={styles.section}>
          Center
        </ThemedText>
        <View style={styles.stack}>
          {centers.map((c) => {
            const active = c.id === center?.id;
            return (
              <Card
                key={c.id}
                onPress={() => {
                  haptics.selection();
                  setCenterId(c.id);
                }}
                padding="base"
                style={[styles.centerCard, active && { borderColor: theme.brand, borderWidth: 1.5 }]}>
                <View style={styles.centerRow}>
                  <View style={[styles.centerIcon, { backgroundColor: active ? theme.brandSubtle : theme.surfaceSunken }]}>
                    <Ionicons
                      name={c.kind === 'blood_bank' ? 'water' : 'business'}
                      size={20}
                      color={active ? theme.brand : theme.textSecondary}
                    />
                  </View>
                  <View style={styles.centerBody}>
                    <ThemedText type="bodyStrong" numberOfLines={1}>
                      {c.name}
                    </ThemedText>
                    <ThemedText type="footnote" color="textSecondary" numberOfLines={1}>
                      {c.distanceKm} km · {c.openNow ? 'Open now' : 'Closed'} · ★ {c.rating.toFixed(1)}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={active ? theme.brand : theme.borderStrong}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      </FadeIn>

      {/* Donation type */}
      <FadeIn delay={60}>
        <ThemedText type="headline" style={styles.section}>
          Donation type
        </ThemedText>
        <View style={styles.typeGrid}>
          {DONATION_TYPES.map((t) => {
            const active = t.value === type;
            return (
              <PressableScale
                key={t.value}
                onPress={() => {
                  haptics.selection();
                  setType(t.value);
                }}
                haptic={false}
                accessibilityRole="button"
                accessibilityLabel={`${t.label}. ${t.detail}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.typeTile,
                  {
                    backgroundColor: active ? theme.brandSubtle : theme.surfaceSunken,
                    borderColor: active ? theme.brand : theme.border,
                  },
                ]}>
                <View style={styles.typeHead}>
                  <Ionicons name={t.icon} size={18} color={active ? theme.brand : theme.textSecondary} />
                  <ThemedText type="bodyStrong" color={active ? 'brand' : 'text'}>
                    {t.label}
                  </ThemedText>
                </View>
                <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
                  {t.detail}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>
      </FadeIn>

      {/* Day selection */}
      <FadeIn delay={120}>
        <ThemedText type="headline" style={styles.section}>
          Date
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {days.map((d) => {
            const active = d.iso === dayIso;
            return (
              <PressableScale
                key={d.iso}
                onPress={() => {
                  haptics.selection();
                  setDayIso(d.iso);
                }}
                haptic={false}
                accessibilityRole="button"
                accessibilityLabel={`${d.dow} ${d.label}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.day,
                  { backgroundColor: active ? theme.brand : theme.surfaceSunken, borderColor: active ? theme.brand : theme.border },
                ]}>
                <ThemedText type="caption" style={{ color: active ? theme.onBrand : theme.textSecondary }}>
                  {d.dow.toUpperCase()}
                </ThemedText>
                <ThemedText type="title2" style={{ color: active ? theme.onBrand : theme.text }}>
                  {d.label}
                </ThemedText>
              </PressableScale>
            );
          })}
        </ScrollView>
      </FadeIn>

      {/* Time slots */}
      <FadeIn delay={180}>
        <ThemedText type="headline" style={styles.section}>
          Time
        </ThemedText>
        <View style={styles.slotGrid}>
          {SLOTS.map((s) => {
            const active = s === slot;
            return (
              <PressableScale
                key={s}
                onPress={() => {
                  haptics.selection();
                  setSlot(s);
                }}
                haptic={false}
                accessibilityRole="button"
                accessibilityLabel={`Time ${s}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.slot,
                  { backgroundColor: active ? theme.brand : theme.surfaceSunken, borderColor: active ? theme.brand : theme.border },
                ]}>
                <ThemedText type="callout" style={{ color: active ? theme.onBrand : theme.text }}>
                  {s}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>
      </FadeIn>

      <FadeIn delay={240}>
        <View style={styles.summary}>
          {slot ? (
            <Badge label={`${center?.name} · ${slot}`} tone="brand" />
          ) : (
            <ThemedText type="footnote" color="textTertiary">
              Select a time to continue
            </ThemedText>
          )}
        </View>
        <Button label="Confirm appointment" fullWidth icon="checkmark-circle" disabled={!canConfirm} loading={bookAppointment.isPending} onPress={confirm} />
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.base },
  section: { marginTop: Spacing.sm },
  stack: { gap: Spacing.sm },
  centerCard: {},
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  centerIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  centerBody: { flex: 1, gap: 2 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeTile: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 150,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: 4,
  },
  typeHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dayRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  day: {
    width: 60,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  slot: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 88,
    alignItems: 'center',
  },
  summary: { alignItems: 'center', marginVertical: Spacing.md, minHeight: 24, justifyContent: 'center' },
});
