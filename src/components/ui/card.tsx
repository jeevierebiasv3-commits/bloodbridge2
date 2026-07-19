import { type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'default' | 'elevated' | 'outline' | 'tinted';

export type CardProps = {
  children: ReactNode;
  variant?: Variant;
  tint?: string; // used with variant="tinted"
  padding?: keyof typeof Spacing | 0;
  radius?: keyof typeof Radius;
  onPress?: () => void;
  /** Screen-reader summary of the card. Applied when the card is pressable. */
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  variant = 'default',
  tint,
  padding = 'lg',
  radius = 'xl',
  onPress,
  accessibilityLabel,
  accessibilityRole,
  style,
}: CardProps) {
  const theme = useTheme();

  const bg =
    variant === 'tinted' ? tint ?? theme.surfaceSunken : variant === 'outline' ? 'transparent' : theme.surface;

  const shadow = variant === 'elevated' ? Shadow.lg : variant === 'outline' ? Shadow.none : Shadow.md;

  const content = (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: Radius[radius],
          padding: padding === 0 ? 0 : Spacing[padding],
          borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth : theme.isDark ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.border,
        },
        variant !== 'outline' && !theme.isDark ? shadow : null,
        variant === 'elevated' && theme.isDark ? shadow : null,
        style,
      ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        scaleTo={0.985}
        onPress={onPress}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel}
        style={styles.press}>
        {content}
      </PressableScale>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  press: { borderRadius: Radius.xl },
});
