/**
 * Emergency request detail. Full context for a single request: urgency,
 * compatibility to the viewer, hospital, distance, units/progress, contact,
 * note, and a respond action that updates the live feed. See design.md §Feed.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  BloodTypeGlyph,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  FadeIn,
  ScreenHeader,
  URGENCY_LABEL,
  URGENCY_TONE,
  useToast,
} from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { canDonateTo, donorsFor } from '@/lib/blood';
import { distanceLabel, longDate, relativeTime, timeOfDay } from '@/lib/format';
import { useAppStore } from '@/store/app-store';

export default function RequestDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, profile, respondToRequest, respondedRequestIds } = useAppStore();

  const [confirming, setConfirming] = useState(false);

  const request = useMemo(() => requests.find((r) => r.id === id), [requests, id]);
  const responded = request ? respondedRequestIds.includes(request.id) : false;
  const compatible = request && profile ? canDonateTo(profile.bloodType, request.bloodType) : false;

  if (!request) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + Spacing.sm }]}>
        <ScreenHeader title="Request" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Request not found"
          subtitle="This request may have been fulfilled or expired."
        />
      </View>
    );
  }

  const fulfilled = request.unitsFulfilled / request.unitsNeeded;

  const onRespond = () => {
    void respondToRequest(request.id);
    setConfirming(false);
    toast.show('Thank you. The hospital has been notified.', 'success');
  };

  const call = () => {
    void Linking.openURL(`tel:${request.contactPhone}`);
  };

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={request.hospital}
          showBack
          large={false}
          trailing={<Badge label={URGENCY_LABEL[request.urgency]} tone={URGENCY_TONE[request.urgency]} dot />}
        />

        {/* Blood type + compatibility */}
        <FadeIn>
          <Card style={styles.hero}>
            <BloodTypeGlyph type={request.bloodType} size="lg" filled />
            <View style={styles.heroText}>
              <ThemedText type="title2">{request.bloodType} needed</ThemedText>
              <ThemedText type="subhead" color="textSecondary">
                {request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''} · patient {request.patientInitials}
              </ThemedText>
              {compatible ? (
                <View style={styles.compatRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <ThemedText type="footnote" color="success">
                    You are compatible
                  </ThemedText>
                </View>
              ) : (
                <ThemedText type="footnote" color="textTertiary">
                  Compatible donors: {donorsFor(request.bloodType).join(', ')}
                </ThemedText>
              )}
            </View>
          </Card>
        </FadeIn>

        {/* Progress */}
        <FadeIn delay={60}>
          <Card>
            <View style={styles.progressHead}>
              <ThemedText type="subhead" color="textSecondary">
                Fulfillment
              </ThemedText>
              <ThemedText type="subhead">
                {request.unitsFulfilled}/{request.unitsNeeded} units
              </ThemedText>
            </View>
            <View style={[styles.track, { backgroundColor: theme.surfaceSunken }]}>
              <View
                style={[styles.fill, { width: `${Math.min(100, fulfilled * 100)}%`, backgroundColor: theme.brand }]}
              />
            </View>
            <ThemedText type="footnote" color="textTertiary" style={styles.responders}>
              {request.respondersCount} donor{request.respondersCount === 1 ? '' : 's'} responding
            </ThemedText>
          </Card>
        </FadeIn>

        {/* Details */}
        <FadeIn delay={120}>
          <Card padding="base">
            <DetailRow icon="location-outline" label="Location" value={`${request.city} · ${distanceLabel(request.distanceKm)}`} />
            <DetailRow icon="time-outline" label="Needed by" value={`${longDate(request.neededBy)}, ${timeOfDay(request.neededBy)}`} />
            <DetailRow icon="hourglass-outline" label="Posted" value={relativeTime(request.postedAt)} />
            <DetailRow icon="person-outline" label="Contact" value={request.contactName} last />
          </Card>
        </FadeIn>

        {/* Note */}
        {request.note ? (
          <FadeIn delay={180}>
            <Card variant="tinted" tint={theme.surfaceSunken}>
              <ThemedText type="subhead" color="textSecondary" style={styles.noteLabel}>
                Additional notes
              </ThemedText>
              <ThemedText type="body">{request.note}</ThemedText>
            </Card>
          </FadeIn>
        ) : null}
      </ScrollView>

      {/* Action bar */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border, paddingBottom: insets.bottom || Spacing.base },
        ]}>
        <Button label="Call" variant="secondary" icon="call" onPress={call} />
        <View style={styles.respondBtn}>
          <Button
            label={responded ? 'You responded' : compatible ? 'Respond to request' : 'Respond anyway'}
            fullWidth
            disabled={responded}
            icon={responded ? 'checkmark' : 'hand-left'}
            onPress={() => setConfirming(true)}
          />
        </View>
      </View>

      <ConfirmSheet
        visible={confirming}
        title="Respond to this request?"
        message="The requester will be notified that you're available to donate. Please only respond if you intend to donate soon."
        confirmLabel="Yes, I can donate"
        cancelLabel="Not now"
        onConfirm={onRespond}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.detailRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.surfaceSunken }]}>
        <Ionicons name={icon} size={16} color={theme.textSecondary} />
      </View>
      <ThemedText type="subhead" color="textSecondary" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText type="subhead" style={styles.detailValue} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  heroText: { flex: 1, gap: 4 },
  compatRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  responders: { marginTop: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  detailIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { width: 88 },
  detailValue: { flex: 1, textAlign: 'right' },
  noteLabel: { marginBottom: Spacing.xs },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  respondBtn: { flex: 1 },
});
