import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';
import { Button } from './button';

export type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSunken }]}>
        <Ionicons name={icon} size={28} color={theme.textTertiary} />
      </View>
      <ThemedText type="headline" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="subhead" color="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 300 },
  action: { marginTop: Spacing.md },
});
