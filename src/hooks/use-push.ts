/**
 * Push opt-in state, held as query state under `qk.push`.
 *
 * Mirrors `use-location`: `usePushState` only *reads* the current permission and
 * never prompts, while `useEnablePush` fires the OS dialog and must be called
 * exclusively from a user tap. Registration posts the Expo token to the server;
 * on grant we also (re)schedule the local "eligible again" reminder so the
 * Phase B countdown pays off without any server round-trip.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/hooks/api/keys';
import { api } from '@/lib/api';
import {
  getPushPermission,
  requestPushRegistration,
  scheduleEligibleAgain,
  type PushPermission,
} from '@/lib/notifications';

/** Current permission. Never prompts, never throws. */
export function usePushState() {
  return useQuery({
    queryKey: qk.push,
    queryFn: getPushPermission,
    staleTime: 300_000,
    retry: false as const,
  });
}

/**
 * Ask for the push grant and register the device token. Must only be called
 * from an explicit user tap — this is the one place the OS dialog appears.
 * Returns the resulting permission so the caller can react (toast, etc.).
 */
export function useEnablePush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<PushPermission> => {
      const result = await requestPushRegistration();
      if (result === 'denied') return 'denied';
      if (result === 'unsupported') return 'unsupported';
      await api.post('/api/push-tokens', result);
      return 'granted';
    },
    onSuccess: (status) => qc.setQueryData<PushPermission>(qk.push, status),
    // A rejected prompt is an answer: cache it so the card collapses for good.
    onError: () => qc.setQueryData<PushPermission>(qk.push, 'denied'),
  });
}

/**
 * (Re)schedule the local "eligible again" reminder — call after a successful
 * opt-in and whenever the cooldown window changes while push is granted.
 * Safe to call unconditionally: it no-ops on web, simulators, and past dates.
 */
export function scheduleEligibilityReminder(nextEligibleDate: Date) {
  void scheduleEligibleAgain(nextEligibleDate);
}
