import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BloodType } from '@/types/domain';

type Size = 'sm' | 'md' | 'lg';

const DIM: Record<Size, number> = { sm: 36, md: 52, lg: 72 };
const FONT: Record<Size, number> = { sm: 14, md: 18, lg: 26 };

export function BloodTypeGlyph({
  type,
  size = 'md',
  filled,
  onDark,
}: {
  type: BloodType;
  size?: Size;
  filled?: boolean;
  /** Render for placement on a dark brand surface (white treatment). */
  onDark?: boolean;
}) {
  const theme = useTheme();
  const dim = DIM[size];

  const bg = onDark ? 'rgba(255,255,255,0.16)' : filled ? theme.brand : theme.brandSubtle;
  const border = onDark ? 'rgba(255,255,255,0.6)' : theme.brand;
  const fg = onDark ? '#FFFFFF' : filled ? theme.onColor : theme.brand;

  return (
    <View
      accessibilityLabel={`Blood type ${type}`}
      style={[
        styles.glyph,
        {
          width: dim,
          height: dim,
          borderRadius: Radius.full,
          backgroundColor: bg,
          borderColor: border,
        },
      ]}>
      <ThemedText
        style={{
          fontSize: FONT[size],
          fontWeight: '700',
          letterSpacing: -0.5,
          color: fg,
        }}>
        {type}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
