import { Redirect } from 'expo-router';

import { useProfile } from '@/hooks/api';
import { ApiClientError } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useAppStore } from '@/store/app-store';

/**
 * Routing gate. Resolves device state (onboarding), then the auth session, then
 * the server profile: onboarding → sign-in → profile-setup → app. Stays null
 * (splash) until each async source settles so there is no flicker.
 */
export default function Index() {
  const { hydrated, onboarded } = useAppStore();
  const { data: session, isPending } = authClient.useSession();
  const hasSession = !!session;
  const profile = useProfile(hasSession);

  if (!hydrated || isPending) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!hasSession) return <Redirect href="/(auth)/sign-in" />;

  // Signed in — decide between profile-setup and the app.
  if (profile.isLoading) return null;
  const notSetUp = profile.error instanceof ApiClientError && profile.error.status === 404;
  if (notSetUp) return <Redirect href="/profile-setup" />;
  if (!profile.data) return null; // transient error — hold on the splash

  return <Redirect href="/(tabs)/home" />;
}
