/**
 * Native nearby map (iOS/Android). This file is picked by Metro's platform
 * resolution so `react-native-maps` never enters the web bundle (see the `.tsx`
 * sibling for the web fallback).
 *
 * Data comes straight from the existing `useCenters()` + `useRequests()` caches
 * — no new endpoints or query keys. Coordinates arrive from the server (centers
 * exact, requests fuzzed to ~110 m); rows without coords simply have no pin.
 *
 * Android + Expo Go caveat: Google Maps needs an API key applied at native build
 * time, which Expo Go can't inject — so on Android the map renders as a blank
 * frame there. We detect that one combination and show the fallback instead; iOS
 * (Apple Maps, no key) and any dev/standalone build get the real map.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
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
 * True only for Android running inside Expo Go — where Google Maps tiles stay
 * blank because the API key is applied at native build time, not by the client.
 */
const ANDROID_EXPO_GO =
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

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

  // Android + Expo Go can't render Google tiles — show the fallback rather than
  // a blank map frame. Safe as a post-hook early return: the flag is a module
  // constant, so the branch never changes across renders.
  if (ANDROID_EXPO_GO) {
    return (
      <EmptyState
        icon="map-outline"
        title="Map needs the mobile build"
        subtitle="The interactive map opens in the BloodBridge app build (or on iOS). Everything else works right here in Expo Go."
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
