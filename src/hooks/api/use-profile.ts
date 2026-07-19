import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiClientError } from '@/lib/api';
import type { CreateProfileBody, UpdateProfileBody } from '@/types/api';
import type { UserProfile } from '@/types/domain';
import { qk } from './keys';

/**
 * The signed-in user's profile. A 404 is a real state ("not set up yet"), not a
 * transient error, so it is never retried — the gate reads it to route to
 * profile-setup. Pass `enabled: false` before a session exists.
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: qk.profile,
    queryFn: () => api.get<UserProfile>('/api/profile'),
    enabled,
    retry: (count, err) =>
      !(err instanceof ApiClientError && err.status === 404) && count < 1,
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProfileBody) => api.post<UserProfile>('/api/profile', body),
    onSuccess: (data) => qc.setQueryData(qk.profile, data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => api.patch<UserProfile>('/api/profile', body),
    onSuccess: (data) => qc.setQueryData(qk.profile, data),
  });
}
