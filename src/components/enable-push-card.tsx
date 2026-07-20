/**
 * Opt-in prompt for blood-need alerts. Shown only while the permission is
 * undetermined — once the user answers (grant, deny, or unsupported runtime),
 * it disappears for good, same no-nag philosophy as EnableLocationCard.
 *
 * On grant we schedule the local "eligible again" reminder from the caller's
 * current cooldown, so a donor mid-window gets the Phase B payoff immediately.
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, FadeIn } from '@/components/ui';
import { useDonations, useProfile } from '@/hooks/api';
import { scheduleEligibilityReminder, useEnablePush, usePushState } from '@/hooks/use-push';
import { useTheme } from '@/hooks/use-theme';
import { computeEligibility, effectiveLastDonation } from '@/lib/blood';
import { Radius, Spacing } from '@/constants/theme';

export function EnablePushCard() {
  const theme = useTheme();
  const { data: status } = usePushState();
  const { data: profile } = useProfile();
  const { data: donations = [] } = useDonations();
  const enable = useEnablePush();

  // Undefined while the permission is still being read — stay invisible rather
  // than flashing a card that may be about to hide itself. Anything other than
  // "undetermined" (denied / granted / unsupported) also hides it.
  if (status !== 'undetermined') return null;

  const onEnable = () =>
    enable.mutate(undefined, {
      onSuccess: (result) => {
        if (result !== 'granted') return;
        const eligibility = computeEligibility(effectiveLastDonation(profile, donations));
        if (!eligibility.eligible) scheduleEligibilityReminder(eligibility.nextEligibleDate);
      },
    });

  return (
    <FadeIn>
      <Card variant="tinted" tint={theme.dangerSubtle} padding="base">
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: theme.surface }]}>
            <Ionicons name="notifications" size={20} color={theme.danger} />
          </View>
          <View style={styles.body}>
            <ThemedText type="bodyStrong">Get alerted when your blood type is needed</ThemedText>
            <ThemedText type="footnote" color="textSecondary">
              We&apos;ll only notify you for nearby requests you can actually help with.
            </ThemedText>
          </View>
        </View>
        <Button
          label="Turn on alerts"
          size="sm"
          variant="secondary"
          icon="notifications-outline"
          loading={enable.isPending}
          onPress={onEnable}
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
