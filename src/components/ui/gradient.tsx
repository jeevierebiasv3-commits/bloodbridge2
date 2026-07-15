/**
 * Brand gradient surface (135deg). Thin wrapper over expo-linear-gradient with
 * the canonical stops from design.md. Used for hero cards and the donor card.
 */

import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { BrandGradient } from '@/constants/theme';

type GradientProps = {
  children?: ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
};

export function Gradient({ children, colors = BrandGradient, style }: GradientProps) {
  return (
    <LinearGradient
      colors={colors as LinearGradientProps['colors']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}>
      {children}
    </LinearGradient>
  );
}
