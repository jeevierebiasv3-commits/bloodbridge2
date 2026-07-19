/**
 * Device location, held as query state under `qk.location`.
 *
 * Coordinates deliberately stay OUT of the data query keys: they ride along as
 * `?lat=&lng=` search params read at fetch time by `locationSearchParams()`.
 * Putting them in the keys would fragment the cache on every GPS nudge and
 * break the optimistic update in `useRespond`.
 *
 * Nothing here ever prompts on its own — `useLocationState` only reads the
 * existing grant, and the OS/browser dialog is fired exclusively by
 * `useEnableLocation` from an explicit user tap.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { qk } from '@/hooks/api/keys';
import { api } from '@/lib/api';
import { type Coords, roundCoord } from '@/lib/geo';
import { queryClient } from '@/lib/query';

export type LocationStatus = 'granted' | 'denied' | 'undetermined';

export interface LocationState {
  status: LocationStatus;
  /** Absent while undetermined/denied, and when a granted fix fails to arrive. */
  coords?: Coords;
}

const FIVE_MINUTES = 300_000;

/** 2 decimals ≈ 1 km: privacy fuzz, and stable params under GPS jitter. */
function toCoords(position: Location.LocationObject): Coords {
  return {
    latitude: roundCoord(position.coords.latitude),
    longitude: roundCoord(position.coords.longitude),
  };
}

const sameCoords = (a: Coords | undefined, b: Coords | undefined) =>
  a?.latitude === b?.latitude && a?.longitude === b?.longitude;

/** Last coords handed to the server, so re-reads from the same spot stay quiet. */
let syncedCoords: Coords | undefined;

/**
 * Store the donor's location so responder rosters can show donor→hospital
 * distances. Fire-and-forget: the profile cache is left alone (the server never
 * serializes coords back), and a failure must never surface in the UI.
 */
function syncProfileCoords(coords: Coords) {
  if (sameCoords(syncedCoords, coords)) return;
  syncedCoords = coords;
  void api.patch('/api/profile', coords).catch(() => {
    syncedCoords = undefined; // let the next read try again
  });
}

/** Coords the distance-bearing queries were last fetched with. */
let appliedCoords: Coords | undefined;

/**
 * Everything a new fix touches: persist it, and refresh the queries whose
 * distances were computed without it. Fetches that raced ahead of the location
 * read (app start) or predate the grant get corrected exactly once.
 */
function adoptCoords(coords: Coords) {
  syncProfileCoords(coords);
  if (sameCoords(appliedCoords, coords)) return;
  appliedCoords = coords;
  // Prefix match, so this covers request detail (`['requests', id]`) too.
  void queryClient.invalidateQueries({ queryKey: qk.requests });
  void queryClient.invalidateQueries({ queryKey: qk.centers });
}

/**
 * The accurate fix, landed straight into the cache a moment after the instant
 * last-known answer. Silent on failure — the last-known value already stands.
 */
function refineInBackground() {
  void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    .then((position) => {
      const coords = toCoords(position);
      const prev = queryClient.getQueryData<LocationState>(qk.location);
      if (sameCoords(prev?.coords, coords)) return;
      queryClient.setQueryData<LocationState>(qk.location, { status: 'granted', coords });
      adoptCoords(coords);
    })
    .catch(() => {});
}

/** Granted-path position read; a failure keeps the grant but yields no coords. */
async function readGrantedCoords(): Promise<LocationState> {
  try {
    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      const coords = toCoords(last);
      adoptCoords(coords);
      refineInBackground(); // last-known can be stale/coarse — sharpen it
      return { status: 'granted', coords };
    }
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords = toCoords(current);
    adoptCoords(coords);
    return { status: 'granted', coords };
  } catch {
    return { status: 'granted' };
  }
}

async function readLocationState(): Promise<LocationState> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      return { status: permission.status === 'denied' ? 'denied' : 'undetermined' };
    }
    return await readGrantedCoords();
  } catch {
    // Unsupported platform or a wedged provider: behave like a fresh install.
    return { status: 'undetermined' };
  }
}

/** Shared config so the hook and the prefetch pass stay in lockstep. */
export const locationQuery = {
  queryKey: qk.location,
  queryFn: readLocationState,
  staleTime: FIVE_MINUTES,
  // "No location" is a normal resting state, not a failure to retry.
  retry: false as const,
};

/** Current permission + coords. Never prompts, never throws. */
export function useLocationState() {
  return useQuery(locationQuery);
}

/**
 * Ask for the grant. Must only be called from an explicit user tap — this is
 * the one place the OS/browser permission dialog appears.
 */
export function useEnableLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<LocationState> => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return { status: 'denied' };
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return { status: 'granted', coords: toCoords(position) };
      } catch {
        return { status: 'granted' };
      }
    },
    onSuccess: (state) => {
      qc.setQueryData<LocationState>(qk.location, state);
      // Everything on screen was computed without coords — adopting them
      // re-fetches so real distances and ordering replace the fallbacks.
      if (state.coords) adoptCoords(state.coords);
    },
    // A rejected prompt is an answer, so cache it: the affordance collapses and
    // the user is never nagged again.
    onError: () => qc.setQueryData<LocationState>(qk.location, { status: 'denied' }),
  });
}

/**
 * `?lat=&lng=` for a data queryFn, or `''` when there is no location. Read at
 * fetch time from the singleton client so query keys stay coordinate-free.
 */
export function locationSearchParams(): string {
  const coords = queryClient.getQueryData<LocationState>(qk.location)?.coords;
  if (!coords) return '';
  return `?lat=${coords.latitude}&lng=${coords.longitude}`;
}
