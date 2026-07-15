/**
 * Bottom-sheet confirmation dialog. Backdrop scrim + spring-in panel with a
 * grabber. Used for destructive actions (cancel appointment, sign out) and
 * important confirmations. See design.md §6 Sheet/Modal, §8 States.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss" />
      </Animated.View>
      <View style={styles.wrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(220)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            { backgroundColor: theme.surfaceElevated, paddingBottom: insets.bottom + Spacing.lg },
            Shadow.lg,
          ]}>
          <View style={[styles.grabber, { backgroundColor: theme.borderStrong }]} />
          <ThemedText type="title2" style={styles.title}>
            {title}
          </ThemedText>
          {message ? (
            <ThemedText type="body" color="textSecondary" style={styles.message}>
              {message}
            </ThemedText>
          ) : null}
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              fullWidth
            />
            <Button label={cancelLabel} variant="ghost" onPress={onCancel} fullWidth />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: Radius.full, marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.xs },
  message: { marginBottom: Spacing.lg },
  actions: { gap: Spacing.sm },
});
