import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
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

  const bg: Record<Variant, string> = {
    primary: theme.brand,
    secondary: theme.surface,
    ghost: 'transparent',
    danger: theme.danger,
  };
  const fg: Record<Variant, ThemeColor> = {
    primary: 'onColor',
    secondary: 'text',
    ghost: 'brand',
    danger: 'onColor',
  };

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
          backgroundColor: bg[variant],
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.border,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style as ViewStyle,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme[fg[variant]]} size="small" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={theme[fg[variant]]} /> : null}
            <ThemedText type={size === 'sm' ? 'callout' : 'bodyStrong'} color={fg[variant]}>
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
