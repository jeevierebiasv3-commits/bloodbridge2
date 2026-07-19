/** Centralized query keys so hooks and invalidations stay in sync. */
export const qk = {
  profile: ['profile'] as const,
  requests: ['requests'] as const,
  request: (id: string) => ['requests', id] as const,
  appointments: ['appointments'] as const,
  donations: ['donations'] as const,
  centers: ['centers'] as const,
  announcements: ['announcements'] as const,
  articles: ['articles'] as const,
  // Device state, not an endpoint: coords live here rather than in the data
  // keys, so GPS jitter can't fragment the cache or break optimistic updates.
  location: ['location'] as const,
};
