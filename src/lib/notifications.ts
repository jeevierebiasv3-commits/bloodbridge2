/**
 * Client-only notification primitives, kept free of React so both the push hook
 * and the root layout can pull from one place.
 *
 * Reality of SDK 57 (see FEATURES_PLAN.md §D):
 * - Remote push works in Expo Go on iOS, but needs a development build on Android.
 * - Local notifications (the "eligible again" reminder) work in Expo Go on both.
 * - Web has no push support at all.
 * Every entry point here degrades to a no-op / `'unsupported'` rather than throw,
 * so callers never have to special-case the platform.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { NotificationResponse } from 'expo-notifications';

import { PH_DONATION_INTERVAL_DAYS } from '@/lib/blood';

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

/** Android channel created before any token request (required on Android 13+). */
const DEFAULT_CHANNEL = 'default';

/** Stable id so rescheduling the eligibility reminder replaces, never stacks. */
const ELIGIBLE_AGAIN_ID = 'eligible-again';

const isWeb = Platform.OS === 'web';

/**
 * Foreground presentation: show a banner + list entry, no sound (a blood alert
 * shouldn't ring in a meeting). Called once from the root layout.
 */
export function configureNotificationHandler() {
  if (isWeb) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL, {
    name: 'Blood requests',
    importance: Notifications.AndroidImportance.HIGH,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/** Read-only permission probe. Never prompts; `'unsupported'` off a real device. */
export async function getPushPermission(): Promise<PushPermission> {
  if (isWeb || !Device.isDevice) return 'unsupported';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unsupported';
  }
}

export interface PushRegistration {
  token: string;
  platform: 'ios' | 'android';
}

/**
 * Prompt (Android channel first), then fetch the Expo push token. Returns the
 * registration on grant, `'denied'` on a rejected prompt, or `'unsupported'`
 * when the device/runtime can't produce a token (web, simulator, Android Expo
 * Go). Only ever call from an explicit user tap.
 */
export async function requestPushRegistration(): Promise<
  PushRegistration | 'denied' | 'unsupported'
> {
  if (isWeb || !Device.isDevice) return 'unsupported';
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'unsupported';

  await ensureAndroidChannel(); // must exist before the prompt on Android 13+

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return 'denied';

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return 'unsupported';

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token, platform: Platform.OS };
  } catch {
    // No push credentials for this runtime (typically Android in Expo Go).
    return 'unsupported';
  }
}

/**
 * Schedule (or replace) the "you're eligible again" local reminder for 9:00 on
 * the given date. A fixed identifier means repeated calls overwrite rather than
 * pile up. No-op on web and for past dates.
 */
export async function scheduleEligibleAgain(nextEligibleDate: Date): Promise<void> {
  if (isWeb || !Device.isDevice) return;

  const fireAt = new Date(nextEligibleDate);
  fireAt.setHours(9, 0, 0, 0);
  if (fireAt.getTime() <= Date.now()) return; // already eligible — nothing to remind

  await cancelEligibleAgain(); // replace any prior schedule
  await Notifications.scheduleNotificationAsync({
    identifier: ELIGIBLE_AGAIN_ID,
    content: {
      title: "You're eligible to donate again 🎉",
      body: `Your ${PH_DONATION_INTERVAL_DAYS}-day recovery window is over. Book your next visit when you can.`,
      data: { url: '/(tabs)/donor' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: DEFAULT_CHANNEL,
    },
  });
}

export async function cancelEligibleAgain(): Promise<void> {
  if (isWeb || !Device.isDevice) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(ELIGIBLE_AGAIN_ID);
  } catch {
    // Nothing scheduled under that id — fine.
  }
}

/** Pull the deep-link target out of a tapped notification's data payload. */
function urlFrom(response: NotificationResponse | null): string | null {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

/**
 * Route to a notification's `data.url` when the user taps it — both while the
 * app is running and on cold start (the tap that launched the app). Native only;
 * a no-op on web. Mount once, from the root layout.
 */
export function useNotificationObserver(onNavigate: (url: string) => void) {
  useEffect(() => {
    if (isWeb) return;
    let handled = false;

    // Cold start: the notification that launched the app, routed once.
    const initial = urlFrom(Notifications.getLastNotificationResponse());
    if (initial) {
      handled = true;
      onNavigate(initial);
    }

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      // Skip the very first live event if it merely echoes the cold-start tap.
      if (handled && urlFrom(response) === initial) {
        handled = false;
        return;
      }
      const url = urlFrom(response);
      if (url) onNavigate(url);
    });
    return () => sub.remove();
  }, [onNavigate]);
}
