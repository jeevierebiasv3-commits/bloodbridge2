/**
 * Static achievement catalog. Unlocked/progress state is computed from live
 * stats on the client — there is no achievements table (see PLAN.md Phase 1).
 */
import type { Achievement } from '@/types/domain';

export interface AchievementStats {
  donationCount: number;
  hasResponded: boolean;
}

export function computeAchievements({ donationCount, hasResponded }: AchievementStats): Achievement[] {
  const toward = (goal: number) => Math.max(0, Math.min(1, donationCount / goal));
  return [
    {
      id: 'ach-1',
      title: 'First Drop',
      description: 'Completed your first donation',
      icon: 'water',
      unlocked: donationCount >= 1,
    },
    {
      id: 'ach-2',
      title: 'Lifesaver',
      description: 'Helped save 3 lives',
      icon: 'heart',
      unlocked: donationCount >= 1,
    },
    {
      id: 'ach-3',
      title: 'Regular',
      description: 'Donated 5 times',
      icon: 'repeat',
      unlocked: donationCount >= 5,
      progress: toward(5),
    },
    {
      id: 'ach-4',
      title: 'Rapid Responder',
      description: 'Answered an emergency request',
      icon: 'flash',
      unlocked: hasResponded,
    },
    {
      id: 'ach-5',
      title: 'Gallon Club',
      description: 'Donate 8 times',
      icon: 'trophy',
      unlocked: donationCount >= 8,
      progress: toward(8),
    },
    {
      id: 'ach-6',
      title: 'Year of Giving',
      description: 'Donate every eligible cycle for a year',
      icon: 'calendar',
      unlocked: false,
      progress: toward(6),
    },
  ];
}
