import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { locationSearchParams } from '@/hooks/use-location';
import { api } from '@/lib/api';
import type { CreateRequestBody, RequestWithMine } from '@/types/api';
import { qk } from './keys';

/**
 * Shared config so the feed hook and the prefetch pass stay in lockstep.
 * Viewer coords are appended at fetch time, never baked into the key.
 */
export const requestsQuery = {
  queryKey: qk.requests,
  queryFn: () => api.get<RequestWithMine[]>(`/api/requests${locationSearchParams()}`),
};

/** Emergency feed — polls every 20s so new requests surface without a refresh. */
export function useRequests() {
  return useQuery({ ...requestsQuery, refetchInterval: 20_000 });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: qk.request(id),
    queryFn: () => api.get<RequestWithMine>(`/api/requests/${id}${locationSearchParams()}`),
    enabled: !!id,
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRequestBody) => api.post<RequestWithMine>('/api/requests', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.requests }),
  });
}

/** Offer to donate. Optimistically flips myResponse + bumps the count. */
export function useRespond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/requests/${id}/respond`, {}),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.requests });
      const prevList = qc.getQueryData<RequestWithMine[]>(qk.requests);
      const prevOne = qc.getQueryData<RequestWithMine>(qk.request(id));

      qc.setQueryData<RequestWithMine[]>(qk.requests, (old) =>
        old?.map((r) =>
          r.id === id && !r.myResponse
            ? { ...r, myResponse: { status: 'offered' }, respondersCount: r.respondersCount + 1 }
            : r,
        ),
      );
      qc.setQueryData<RequestWithMine>(qk.request(id), (old) =>
        old && !old.myResponse
          ? { ...old, myResponse: { status: 'offered' }, respondersCount: old.respondersCount + 1 }
          : old,
      );
      return { prevList, prevOne, id };
    },
    onError: (_e, id, ctx) => {
      if (ctx?.prevList) qc.setQueryData(qk.requests, ctx.prevList);
      if (ctx?.prevOne) qc.setQueryData(qk.request(id), ctx.prevOne);
    },
    onSettled: (_d, _e, id) => {
      qc.invalidateQueries({ queryKey: qk.requests });
      qc.invalidateQueries({ queryKey: qk.request(id) });
    },
  });
}

function ownerAction(requestId: string, action: 'cancel' | 'fulfill') {
  return () => api.post<RequestWithMine>(`/api/requests/${requestId}/${action}`, {});
}

export function useCancelRequest(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ownerAction(requestId, 'cancel'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.request(requestId) });
      qc.invalidateQueries({ queryKey: qk.requests });
    },
  });
}

export function useFulfillRequest(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ownerAction(requestId, 'fulfill'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.request(requestId) });
      qc.invalidateQueries({ queryKey: qk.requests });
    },
  });
}

export function useConfirmResponder(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responderId: string) =>
      api.post<RequestWithMine>(
        `/api/requests/${requestId}/responders/${responderId}/confirm`,
        {},
      ),
    onSuccess: () => {
      // Re-fetch the detail (roster + progress) and the feed.
      qc.invalidateQueries({ queryKey: qk.request(requestId) });
      qc.invalidateQueries({ queryKey: qk.requests });
    },
  });
}
