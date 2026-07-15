/**
 * Resolves the active theme. Returns the color map plus the scheme name and a
 * convenience `isDark` flag for elevation/gradient adjustments.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type Scheme = 'light' | 'dark';

export function useScheme(): Scheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useTheme(): ThemeColors & { scheme: Scheme; isDark: boolean } {
  const scheme = useScheme();
  return { ...(Colors[scheme] as ThemeColors), scheme, isDark: scheme === 'dark' };
}
