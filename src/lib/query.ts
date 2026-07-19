/**
 * Shared TanStack Query client. Short staleTime keeps the emergency feed fresh;
 * a single retry absorbs Neon cold starts without masking real failures.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
