import { useQuery } from '@tanstack/react-query';

import { locationSearchParams } from '@/hooks/use-location';
import { api } from '@/lib/api';
import type {
  Announcement,
  Donation,
  DonationCenter,
  EducationArticle,
} from '@/types/domain';
import { qk } from './keys';

const HOUR = 3_600_000;

// Shared query configs so the hooks and the prefetch pass stay in lockstep.
export const donationsQuery = {
  queryKey: qk.donations,
  queryFn: () => api.get<Donation[]>('/api/donations'),
};

// Viewer coords are appended at fetch time (see `locationSearchParams`); the
// key stays coordinate-free so granting location refreshes in place.
export const centersQuery = {
  queryKey: qk.centers,
  queryFn: () => api.get<DonationCenter[]>(`/api/centers${locationSearchParams()}`),
  staleTime: HOUR,
};

export const announcementsQuery = {
  queryKey: qk.announcements,
  queryFn: () => api.get<Announcement[]>('/api/announcements'),
  staleTime: HOUR,
};

export const articlesQuery = {
  queryKey: qk.articles,
  queryFn: () => api.get<EducationArticle[]>('/api/articles'),
  staleTime: HOUR,
};

export function useDonations() {
  return useQuery(donationsQuery);
}

export function useCenters() {
  return useQuery(centersQuery);
}

export function useAnnouncements() {
  return useQuery(announcementsQuery);
}

export function useArticles() {
  return useQuery(articlesQuery);
}
