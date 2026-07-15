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
import { mockCenters } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';
import { Appointment } from '@/types/domain';

const SLOTS = ['08:30', '09:15', '10:00', '11:30', '13:00', '14:45', '16:00'];

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
  const { bookAppointment } = useAppStore();

  const days = useMemo(() => nextDays(10), []);
  const [centerId, setCenterId] = useState(mockCenters[0]?.id ?? '');
  const [dayIso, setDayIso] = useState(days[1]?.iso ?? days[0].iso);
  const [slot, setSlot] = useState<string | null>(null);

  const center = mockCenters.find((c) => c.id === centerId) ?? mockCenters[0];
  const canConfirm = Boolean(center && slot);

  const confirm = () => {
    if (!center || !slot) {
      haptics.error();
      return;
    }
    const [h, m] = slot.split(':').map(Number);
    const when = new Date(dayIso);
    when.setHours(h, m, 0, 0);
    const appointment: Appointment = {
      id: `apt-${when.getTime()}`,
      centerName: center.name,
      address: center.address,
      date: when.toISOString(),
      status: 'confirmed',
      type: 'whole',
    };
    void bookAppointment(appointment);
    haptics.success();
    toast.show('Appointment confirmed', 'success');
    router.back();
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
          {mockCenters.map((c) => {
            const active = c.id === centerId;
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

      {/* Day selection */}
      <FadeIn delay={60}>
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
                <ThemedText type="caption" style={{ color: active ? theme.onColor : theme.textSecondary }}>
                  {d.dow.toUpperCase()}
                </ThemedText>
                <ThemedText type="title2" style={{ color: active ? theme.onColor : theme.text }}>
                  {d.label}
                </ThemedText>
              </PressableScale>
            );
          })}
        </ScrollView>
      </FadeIn>

      {/* Time slots */}
      <FadeIn delay={120}>
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
                <ThemedText type="callout" style={{ color: active ? theme.onColor : theme.text }}>
                  {s}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>
      </FadeIn>

      <FadeIn delay={180}>
        <View style={styles.summary}>
          {slot ? (
            <Badge label={`${center?.name} · ${slot}`} tone="brand" />
          ) : (
            <ThemedText type="footnote" color="textTertiary">
              Select a time to continue
            </ThemedText>
          )}
        </View>
        <Button label="Confirm appointment" fullWidth icon="checkmark-circle" disabled={!canConfirm} onPress={confirm} />
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
