/**
 * Opt-in prompt for real distances. Shown only while the permission is
 * undetermined — once the user answers, it disappears for good. There is no
 * "you denied this" banner: fallback distances keep working silently, so a
 * decline costs the user nothing and earns no guilt.
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, FadeIn } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useEnableLocation, useLocationState } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';

export function EnableLocationCard() {
  const theme = useTheme();
  const { data } = useLocationState();
  const enable = useEnableLocation();

  // Undefined while the permission is still being read — stay invisible rather
  // than flashing a card that may be about to hide itself.
  if (data?.status !== 'undetermined') return null;

  return (
    <FadeIn>
      <Card variant="tinted" tint={theme.infoSubtle} padding="base">
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: theme.surface }]}>
            <Ionicons name="navigate" size={20} color={theme.info} />
          </View>
          <View style={styles.body}>
            <ThemedText type="bodyStrong">See real distances</ThemedText>
            <ThemedText type="footnote" color="textSecondary">
              Enable location to sort centers and requests by how far they actually are.
            </ThemedText>
          </View>
        </View>
        <Button
          label="Enable"
          size="sm"
          variant="secondary"
          icon="location-outline"
          loading={enable.isPending}
          onPress={() => enable.mutate()}
          style={styles.action}
        />
      </Card>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  action: { marginTop: Spacing.md, alignSelf: 'flex-start' },
});
