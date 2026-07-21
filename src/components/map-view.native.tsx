/**
 * Native nearby map (iOS/Android). This file is picked by Metro's platform
 * resolution so `react-native-maps` never enters the web bundle (see the `.tsx`
 * sibling for the web fallback).
 *
 * Data comes straight from the existing `useCenters()` + `useRequests()` caches
 * — no new endpoints or query keys. Coordinates arrive from the server (centers
 * exact, requests fuzzed to ~110 m); rows without coords simply have no pin.
 *
 * Android needs a Google Maps API key, and a missing one is not a blank map — it
 * is `IllegalStateException: API key not found` thrown from MapView.onCreate,
 * inside the native view. That is a native crash, so no error boundary or
 * try/catch can contain it; the only safe move is to not mount MapView unless
 * the key can actually be there. Hence `androidMapReady` below.
 *
 * The SDK 57 docs say "no additional setup is required when testing your project
 * using Expo Go" — that is not true for Google Maps on Android; a device proved
 * it. Trust this comment over the docs page.
 *
 * iOS is unaffected: Apple Maps needs no key.
 */

import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { EmptyState, URGENCY_LABEL } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCenters, useRequests } from '@/hooks/api';
import { useLocationState } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { distanceLabel } from '@/lib/format';
import type { Urgency } from '@/types/domain';

/**
 * Can Android actually mount Google Maps in this runtime? Two things must hold,
 * and checking only one of them is how this broke before:
 *
 * 1. A key is declared in app.json (`android.config.googleMaps.apiKey`). Without
 *    it *no* Android build works — not Expo Go, not a dev build.
 * 2. We are not in Expo Go. Even with the key declared, Expo Go cannot apply it:
 *    it lands in the native manifest at build time, and Expo Go's binary was
 *    built without it.
 *
 * `appOwnership` is deprecated but is the only value that separates Expo Go from
 * a dev build — `executionEnvironment` reports `StoreClient` for both, so gating
 * on it would keep the map hidden in the dev build that can actually show it.
 */
const IS_EXPO_GO = Constants.appOwnership === 'expo';
const HAS_MAPS_KEY = Boolean(Constants.expoConfig?.android?.config?.googleMaps?.apiKey);
const androidMapReady = HAS_MAPS_KEY && !IS_EXPO_GO;

// Metro Cebu anchor — where the seed data lives — used until a device fix lands.
const CEBU_ANCHOR = { latitude: 10.3111, longitude: 123.8931 };
const DELTA = 0.15;

export function NearbyMap() {
  const theme = useTheme();
  const router = useRouter();
  const { data: centers = [] } = useCenters();
  const { data: requests = [] } = useRequests();
  const { data: location } = useLocationState();

  // Urgency → pin color. Only active requests get a pin, so fulfilled/expired
  // hues are never reached, but keeping all four keeps the map self-consistent.
  const urgencyColor: Record<Urgency, string> = {
    critical: theme.danger,
    urgent: theme.warning,
    moderate: theme.info,
    routine: theme.textTertiary,
  };

  const origin = location?.coords ?? CEBU_ANCHOR;
  const centerPins = centers.filter((c) => c.latitude != null && c.longitude != null);
  const requestPins = requests.filter(
    (r) => (r.status === 'open' || r.status === 'partial') && r.latitude != null && r.longitude != null,
  );

  // Mounting MapView without a usable key crashes the app natively, so bail to a
  // message instead. Post-hook early return is safe: both flags are module
  // constants, so the branch never changes across renders.
  if (Platform.OS === 'android' && !androidMapReady) {
    return (
      <EmptyState
        icon="map-outline"
        title="Map needs a Google Maps key"
        subtitle="Android maps require a Google Maps API key in app.json and a development build — Expo Go can't supply one. Centers and requests are all still listed on the other tabs."
      />
    );
  }

  return (
    <View style={styles.fill}>
      <MapView
        // Google Maps on Android (needs the API key from the dev build); iOS
        // stays on Apple Maps, which needs no key.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.fill}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        }}
        showsUserLocation={location?.status === 'granted'}>
        {centerPins.map((c) => (
          <Marker
            key={c.id}
            coordinate={{ latitude: c.latitude!, longitude: c.longitude! }}
            pinColor={theme.brand}
            onCalloutPress={() => router.push('/book')}>
            <Callout onPress={() => router.push('/book')}>
              <View style={styles.callout}>
                <ThemedText type="bodyStrong">{c.name}</ThemedText>
                <ThemedText type="footnote" color="textSecondary">
                  {distanceLabel(c.distanceKm)} · {c.openNow ? 'Open now' : 'Closed'}
                </ThemedText>
                <ThemedText type="footnote" color="textSecondary">
                  {c.hours}
                </ThemedText>
              </View>
            </Callout>
          </Marker>
        ))}
        {requestPins.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude!, longitude: r.longitude! }}
            pinColor={urgencyColor[r.urgency]}
            onCalloutPress={() => router.push(`/request/${r.id}`)}>
            <Callout onPress={() => router.push(`/request/${r.id}`)}>
              <View style={styles.callout}>
                <ThemedText type="bodyStrong">
                  {r.bloodType} · {URGENCY_LABEL[r.urgency]}
                </ThemedText>
                <ThemedText type="footnote" color="textSecondary">
                  {r.hospital}
                </ThemedText>
                <ThemedText type="footnote" color="textSecondary">
                  {distanceLabel(r.distanceKm)} away
                </ThemedText>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  callout: { gap: 2, paddingVertical: Spacing.xs, minWidth: 160 },
});
