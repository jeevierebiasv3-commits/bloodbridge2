/**
 * Emergency request card — used in the home dashboard and the live feed.
 * Shows urgency, blood type, compatibility to the viewer, hospital, distance,
 * fulfillment progress, and time posted. See design.md §5, §6.
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, URGENCY_LABEL, URGENCY_TONE } from '@/components/ui/badge';
import { BloodTypeGlyph } from '@/components/ui/blood-type-glyph';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { canDonateTo } from '@/lib/blood';
import { distanceLabel, relativeTime } from '@/lib/format';
import { EmergencyRequest, BloodType } from '@/types/domain';

export function RequestCard({
  request,
  viewerType,
  viewerId,
  onPress,
}: {
  request: EmergencyRequest;
  viewerType?: BloodType;
  viewerId?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const isOwn = !!viewerId && request.ownerId === viewerId;
  const compatible = !isOwn && viewerType ? canDonateTo(viewerType, request.bloodType) : false;
  const exactMatch = compatible && viewerType === request.bloodType;
  const fulfilled = request.unitsFulfilled / request.unitsNeeded;

  const a11yLabel =
    `${URGENCY_LABEL[request.urgency]} request: ${request.bloodType} blood needed at ` +
    `${request.hospital}, ${request.city}, ${distanceLabel(request.distanceKm)} away. ` +
    `${request.unitsFulfilled} of ${request.unitsNeeded} units fulfilled.` +
    (isOwn ? ' Your request.' : exactMatch ? ' Exact match — you can help.' : compatible ? ' You can help.' : '');

  return (
    <Card onPress={onPress} accessibilityLabel={a11yLabel} padding="base" style={styles.card}>
      <View style={styles.top}>
        <BloodTypeGlyph type={request.bloodType} size="md" />
        <View style={styles.headText}>
          <View style={styles.titleRow}>
            <ThemedText type="headline" numberOfLines={2} style={styles.hospital}>
              {request.hospital}
            </ThemedText>
            <Badge
              label={URGENCY_LABEL[request.urgency]}
              tone={URGENCY_TONE[request.urgency]}
              dot
              style={styles.urgency}
            />
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={theme.textTertiary} />
            <ThemedText type="footnote" color="textSecondary">
              {request.city} · {distanceLabel(request.distanceKm)}
            </ThemedText>
            <ThemedText type="footnote" color="textTertiary">
              · {relativeTime(request.postedAt)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.units}>
          <View style={[styles.track, { backgroundColor: theme.surfaceSunken }]}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, fulfilled * 100)}%`, backgroundColor: theme.brand },
              ]}
            />
          </View>
          <ThemedText type="footnote" color="textSecondary">
            {request.unitsFulfilled}/{request.unitsNeeded} units · {request.respondersCount} responding
          </ThemedText>
        </View>
        {isOwn ? (
          <Badge label="Your request" tone="info" />
        ) : exactMatch ? (
          <Badge label="Exact match" tone="brand" />
        ) : compatible ? (
          <Badge label="You can help" tone="success" />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  top: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  headText: { flex: 1, gap: 4 },
  // Top-aligned so the badge stays pinned when the hospital name wraps to two
  // lines instead of truncating.
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, justifyContent: 'space-between' },
  hospital: { flex: 1 },
  urgency: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  units: { flex: 1, gap: 6 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
