/**
 * Warms the React Query cache for every tab's data the moment the app enters
 * the authenticated tab navigator. On the web preview the API answers in a few
 * ms, so this is invisible — but on a real device each list takes a network
 * round-trip, and without warming, tabs render blank (or a false empty state)
 * for ~1s and then pop their content in. Prefetching while the user is still on
 * Home makes later tab switches feel instant.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { appointmentsQuery } from './use-appointments';
import { announcementsQuery, articlesQuery, centersQuery, donationsQuery } from './use-content';
import { requestsQuery } from './use-requests';

export function usePrefetchAppData() {
  const qc = useQueryClient();
  useEffect(() => {
    void qc.prefetchQuery(requestsQuery);
    void qc.prefetchQuery(appointmentsQuery);
    void qc.prefetchQuery(donationsQuery);
    void qc.prefetchQuery(centersQuery);
    void qc.prefetchQuery(announcementsQuery);
    void qc.prefetchQuery(articlesQuery);
  }, [qc]);
}
