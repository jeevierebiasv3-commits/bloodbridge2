import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export function Avatar({
  name,
  uri,
  size = 44,
  color,
}: {
  name: string;
  uri?: string | null;
  size?: number;
  /** Optional personalized background (e.g. profile.avatarColor). */
  color?: string;
}) {
  const theme = useTheme();
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  const bg = color ?? theme.brandSubtle;
  const fg = color ? '#FFFFFF' : theme.brand;

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: bg },
      ]}>
      <ThemedText
        type="headline"
        style={{ fontSize: size * 0.38, lineHeight: size * 0.38, color: fg }}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
});
