/**
 * Bottom-sheet confirmation dialog. Backdrop scrim + slide-up panel with a
 * grabber. Used for destructive actions (cancel appointment, sign out) and
 * important confirmations. See design.md §6 Sheet/Modal, §8 States.
 *
 * The show/hide animation is driven manually with a shared value instead of
 * Reanimated `entering`/`exiting`: layout animations inside a Modal flash at
 * the final position for a frame on Android before jumping to the start, and
 * the old spring overshot into a bounce. A plain eased slide does neither.
 */

import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

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
  const reduceMotion = useReduceMotion();
  const { height: windowHeight } = useWindowDimensions();

  // The Modal stays mounted while the exit animation plays out. Mounting on
  // show happens during render (the React-endorsed "adjust state on prop
  // change" pattern); unmounting waits for the exit animation's callback.
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const progress = useSharedValue(0); // 0 hidden → 1 shown

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: reduceMotion ? 0 : 240, easing: EASE_OUT });
    } else {
      progress.value = withTiming(
        0,
        { duration: reduceMotion ? 0 : 200, easing: EASE_IN },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
  }, [visible, reduceMotion, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    // Slide by the sheet's own height; until measured, park it offscreen.
    transform: [{ translateY: (1 - progress.value) * (sheetHeight || windowHeight) }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
      // Extend under the Android navigation bar; without this the modal window
      // stops above it, leaving a dimmed gap below the sheet.
      navigationBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss" />
      </Animated.View>
      <View style={styles.wrap} pointerEvents="box-none">
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            { backgroundColor: theme.surfaceElevated, paddingBottom: insets.bottom + Spacing.lg },
            Shadow.lg,
            sheetStyle,
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
