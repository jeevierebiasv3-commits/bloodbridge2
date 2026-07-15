import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const enabled = Platform.OS !== 'web';

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error';

export const haptics: Record<HapticKind, () => void> = {
  light() {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium() {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  selection() {
    if (enabled) void Haptics.selectionAsync();
  },
  success() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
