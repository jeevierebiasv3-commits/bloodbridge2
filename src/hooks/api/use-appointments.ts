import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { CreateAppointmentBody } from '@/types/api';
import type { Appointment } from '@/types/domain';
import { qk } from './keys';

/** Shared config so the hook and the prefetch pass stay in lockstep. */
export const appointmentsQuery = {
  queryKey: qk.appointments,
  queryFn: () => api.get<Appointment[]>('/api/appointments'),
};

export function useAppointments() {
  return useQuery(appointmentsQuery);
}

/** Single appointment, selected from the cached list (matches the article/[id] pattern). */
export function useAppointment(id: string | undefined) {
  const query = useAppointments();
  return {
    ...query,
    data: id ? query.data?.find((a) => a.id === id) : undefined,
  };
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAppointmentBody) => api.post<Appointment>('/api/appointments', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.appointments }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Appointment>(`/api/appointments/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.appointments }),
  });
}

/**
 * Mark a completed visit done. The server also records a donation and advances
 * the profile's `lastDonationDate`, so refresh all three caches: the appointment
 * list (status), donation history/impact, and the profile (eligibility countdown).
 */
export function useCompleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Appointment>(`/api/appointments/${id}/complete`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.appointments });
      void qc.invalidateQueries({ queryKey: qk.donations });
      void qc.invalidateQueries({ queryKey: qk.profile });
    },
  });
}
