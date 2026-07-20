/**
 * Nearby map screen. A full-bleed map (native) or a fallback (web) under a
 * floating header. Registered as a `card` in the root layout; data rides the
 * existing centers/requests caches, so opening it costs no extra fetches.
 */

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NearbyMap } from '@/components/map-view';
import { ScreenHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <ScreenHeader
          title="Nearby map"
          subtitle="Centers and open requests around you"
          showBack
          onBack={() => router.back()}
          large={false}
        />
      </View>
      <View style={styles.map}>
        <NearbyMap />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  map: { flex: 1 },
});
