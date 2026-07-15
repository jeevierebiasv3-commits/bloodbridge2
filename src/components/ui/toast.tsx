/**
 * Lightweight toast system. Top-anchored, auto-dismissing, semantic accent bar.
 * Exposes `useToast().show(...)`. See design.md §6 Toast, §7 Motion.
 */

import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';

type ToastTone = 'success' | 'danger' | 'info' | 'warning';
type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastApi = { show: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastTone, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  danger: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    seq.current += 1;
    setToast({ id: seq.current, message, tone });
    if (tone === 'danger') haptics.error();
    else if (tone === 'warning') haptics.warning();
    else haptics.success();
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <View pointerEvents="none" style={[styles.host, { top: insets.top + Spacing.sm }]}>
          <Animated.View
            key={toast.id}
            entering={FadeInUp.springify().damping(18)}
            exiting={FadeOutUp.duration(180)}
            style={[styles.toast, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, Shadow.lg]}>
            <View style={[styles.accent, { backgroundColor: theme[toast.tone] }]} />
            <Ionicons name={ICONS[toast.tone]} size={20} color={theme[toast.tone]} />
            <ThemedText type="subhead" style={styles.text}>
              {toast.message}
            </ThemedText>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: Spacing.base, right: Spacing.base, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    maxWidth: 440,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  text: { flexShrink: 1 },
});
