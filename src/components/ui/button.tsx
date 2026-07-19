import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

const HEIGHT: Record<Size, number> = { sm: 40, md: 48, lg: 56 };
const PADDING: Record<Size, number> = { sm: Spacing.base, md: Spacing.lg, lg: Spacing.xl };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  icon,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  // Loading keeps the variant's fill (with a spinner); only a truly disabled
  // button drops to the quiet sunken treatment.
  const showDisabled = disabled && !loading;

  const bg: Record<Variant, string> = {
    primary: theme.brand,
    secondary: theme.surface,
    ghost: 'transparent',
    danger: theme.danger,
    // Fixed white-on-ink pairing for placement on brandDeep panels — identical
    // in both themes so deep-navy heroes always get a crisp CTA.
    inverse: '#FFFFFF',
  };
  const fg: Record<Variant, string> = {
    primary: theme.onBrand,
    secondary: theme.text,
    ghost: theme.brand,
    danger: theme.onBrand,
    inverse: Colors.light.brandDeep,
  };

  const background = showDisabled ? theme.surfaceSunken : bg[variant];
  const foreground = showDisabled ? theme.textTertiary : fg[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      disabled={isDisabled}
      haptic={variant === 'primary' || variant === 'danger' ? 'medium' : 'light'}
      onPress={onPress}
      style={[
        styles.base,
        {
          height: HEIGHT[size],
          paddingHorizontal: PADDING[size],
          backgroundColor: background,
          borderWidth: variant === 'secondary' && !showDisabled ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style as ViewStyle,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={foreground} size="small" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={foreground} /> : null}
            <ThemedText type={size === 'sm' ? 'callout' : 'bodyStrong'} style={{ color: foreground }}>
              {label}
            </ThemedText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
