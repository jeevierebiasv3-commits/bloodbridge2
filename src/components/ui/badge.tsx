import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Urgency } from '@/types/domain';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  style?: ViewStyle;
};

export function Badge({ label, tone = 'neutral', dot, style }: BadgeProps) {
  const theme = useTheme();

  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.surfaceSunken, fg: theme.textSecondary },
    brand: { bg: theme.brandSubtle, fg: theme.brand },
    success: { bg: theme.successSubtle, fg: theme.success },
    warning: { bg: theme.warningSubtle, fg: theme.warning },
    danger: { bg: theme.dangerSubtle, fg: theme.danger },
    info: { bg: theme.infoSubtle, fg: theme.info },
  };
  const { bg, fg } = map[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      <ThemedText type="caption" style={[styles.label, { color: fg }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export const URGENCY_TONE: Record<Urgency, BadgeTone> = {
  critical: 'danger',
  urgent: 'warning',
  moderate: 'info',
  routine: 'neutral',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  critical: 'Critical',
  urgent: 'Urgent',
  moderate: 'Moderate',
  routine: 'Routine',
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { textTransform: 'uppercase' },
});
