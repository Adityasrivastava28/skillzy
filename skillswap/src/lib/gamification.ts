import type { User } from "./types";

export const SESSION_XP = 15;
export const EXCHANGE_COMPLETE_XP = 30;
export const FIRST_SWAP_BONUS_XP = 50;

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  /** lucide-react icon name, resolved by the component that renders it. */
  icon: "Handshake" | "BookOpen" | "GraduationCap" | "Repeat2" | "Star" | "Flame" | "Trophy" | "Sparkles";
  check: (u: User) => boolean;
}

/**
 * Every badge is a pure function over the user's real, already-stored stats —
 * no separate "badges earned" list to keep in sync, no fabricated numbers.
 * Add a badge by adding a rule here; it starts applying retroactively.
 */
export const BADGES: BadgeDef[] = [
  { id: "first-swap", label: "First Swap", description: "Completed your first skill exchange", icon: "Handshake", check: (u) => u.exchanges >= 1 },
  { id: "three-swaps", label: "Serial Swapper", description: "Completed 3 skill exchanges", icon: "Repeat2", check: (u) => u.exchanges >= 3 },
  { id: "five-sessions", label: "Dedicated Learner", description: "Completed 5 sessions", icon: "BookOpen", check: (u) => u.sessionsCompleted >= 5 },
  { id: "ten-sessions", label: "Mentor", description: "Completed 10 sessions", icon: "GraduationCap", check: (u) => u.sessionsCompleted >= 10 },
  { id: "top-rated", label: "Top Rated", description: "4.5+ rating across 3 or more exchanges", icon: "Star", check: (u) => u.rating >= 4.5 && u.exchanges >= 3 },
  { id: "week-streak", label: "On a Roll", description: "7-day activity streak", icon: "Flame", check: (u) => u.streak >= 7 },
  { id: "level-5", label: "Rising Star", description: "Reached Level 5", icon: "Trophy", check: (u) => u.level >= 5 },
  { id: "level-10", label: "SkillSwap Veteran", description: "Reached Level 10", icon: "Sparkles", check: (u) => u.level >= 10 },
];

export function earnedBadges(user: User): BadgeDef[] {
  return BADGES.filter((b) => b.check(user));
}

export function badgeCount(user: User): number {
  return earnedBadges(user).length;
}

/** Where a user's XP actually came from — ties out exactly to `xp` since these are the only two sources. */
export function xpBreakdown(user: User) {
  const fromSessions = user.sessionsCompleted * SESSION_XP;
  const fromSwaps = user.exchanges * EXCHANGE_COMPLETE_XP;
  const firstSwapBonus = user.exchanges >= 1 ? FIRST_SWAP_BONUS_XP : 0;
  return {
    fromSessions,
    fromSwaps,
    firstSwapBonus,
    total: fromSessions + fromSwaps + firstSwapBonus,
  };
}
