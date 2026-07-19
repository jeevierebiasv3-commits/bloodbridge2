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
};
