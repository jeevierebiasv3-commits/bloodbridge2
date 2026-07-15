import { Redirect } from 'expo-router';

import { useAppStore } from '@/store/app-store';

/**
 * Routing gate. Sends the user to the right place based on persisted state:
 * onboarding → auth → the main app. Kept declarative; the splash stays up
 * until the store hydrates (handled in _layout).
 */
export default function Index() {
  const { hydrated, onboarded, profile } = useAppStore();

  if (!hydrated) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!profile) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(tabs)/home" />;
}
