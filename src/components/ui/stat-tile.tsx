import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card } from './card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatTileProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tint?: 'brand' | 'success' | 'info' | 'warning' | 'neutral';
};

const TINTS = {
  brand: { fg: 'brand', bg: 'brandSubtle' },
  success: { fg: 'success', bg: 'successSubtle' },
  info: { fg: 'info', bg: 'infoSubtle' },
  warning: { fg: 'warning', bg: 'warningSubtle' },
  neutral: { fg: 'textSecondary', bg: 'surfaceSunken' },
} as const;

export function StatTile({ label, value, icon, tint = 'neutral' }: StatTileProps) {
  const theme = useTheme();
  const tokens = TINTS[tint];

  return (
    <Card style={styles.card} padding="base">
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: theme[tokens.bg] }]}>
          <Ionicons name={icon} size={18} color={theme[tokens.fg]} />
        </View>
      ) : null}
      <ThemedText type="title2" style={styles.value}>
        {value}
      </ThemedText>
      <ThemedText type="footnote" color="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: Spacing.xs },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: { marginTop: 'auto' },
});
