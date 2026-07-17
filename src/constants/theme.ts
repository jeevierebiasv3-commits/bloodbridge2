/**
 * Vesta design tokens — the single source of truth for color, type, spacing,
 * radius, and elevation. See design.md. Never hardcode values outside this file.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Brand
    brand: '#D9474D',
    brandStrong: '#C93A42',
    brandSubtle: '#FEEBEC',
    brandDeep: '#151A36',
    onBrand: '#FFFFFF',
    // Surfaces
    background: '#FBFBFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSunken: '#F4F4F6',
    // Text
    text: '#16192D',
    textSecondary: '#596078',
    textTertiary: '#7B8299',
    onColor: '#FFFFFF',
    // Lines
    border: '#E8E9F0',
    borderStrong: '#D5D8E4',
    // Status
    success: '#30A46C',
    successSubtle: '#E7F6EC',
    warning: '#D97706',
    warningSubtle: '#FEF3E2',
    danger: '#E5484D',
    dangerSubtle: '#FEEBEC',
    info: '#3B82F6',
    infoSubtle: '#E8F1FE',
  },
  dark: {
    // Brand
    brand: '#FF777B',
    brandStrong: '#F05C64',
    brandSubtle: '#2A1416',
    brandDeep: '#0E1125',
    onBrand: '#FFFFFF',
    // Surfaces
    background: '#08080A',
    surface: '#131316',
    surfaceElevated: '#1B1B1F',
    surfaceSunken: '#0E0E11',
    // Text
    text: '#F7F7FB',
    textSecondary: '#A5A8BC',
    textTertiary: '#777B92',
    onColor: '#FFFFFF',
    // Lines
    border: '#282B3D',
    borderStrong: '#3A3E54',
    // Status
    success: '#3DD68C',
    successSubtle: '#0F2318',
    warning: '#F5A524',
    warningSubtle: '#291A08',
    danger: '#F16A6F',
    dangerSubtle: '#2A1416',
    info: '#5B9DFF',
    infoSubtle: '#0C1B33',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
})!;

/** 4px base grid. Never use raw spacing numbers in components. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 999,
} as const;

/** Soft, low-spread elevation. Consumed via `elevation()` helper. */
export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
} as const;

/** Standard reanimated spring for press + entrance motion. */
export const Spring = { damping: 18, stiffness: 200, mass: 0.9 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
