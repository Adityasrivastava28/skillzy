import type { MatchBreakdown, User } from "./types";

/**
 * Transparent matching score. Weights are exported so the UI tooltip
 * ("why this %?") can explain exactly how the number is made.
 * Testing showed 4/6 users did not understand a bare match %.
 */
export const MATCH_WEIGHTS = { skillFit: 0.5, availability: 0.3, goals: 0.2 } as const;

const norm = (s: string) => s.trim().toLowerCase();
const set = (xs: string[]) => new Set(xs.map(norm));

/** Share of `needs` that `offers` covers (0..1). Empty needs => 0. */
function coverage(needs: string[], offers: string[]) {
  const n = set(needs);
  const o = set(offers);
  if (n.size === 0) return 0;
  let hit = 0;
  n.forEach((x) => o.has(x) && hit++);
  return hit / n.size;
}

function overlap(a: string[], b: string[]) {
  const A = set(a);
  const B = set(b);
  const denom = Math.min(A.size, B.size);
  if (denom === 0) return 0;
  let hit = 0;
  A.forEach((x) => B.has(x) && hit++);
  return hit / denom;
}

/** Two-way skill fit: I can teach what you want AND you can teach what I want. */
function skillFit(a: User, b: User) {
  const aLearns = coverage(a.wants, b.canTeach);
  const bLearns = coverage(b.wants, a.canTeach);
  return (aLearns + bLearns) / 2;
}

export function scoreMatch(a: User, b: User): MatchBreakdown {
  const s = skillFit(a, b);
  const av = overlap(a.availability, b.availability);
  const g = overlap(a.goals, b.goals);
  const overall =
    s * MATCH_WEIGHTS.skillFit + av * MATCH_WEIGHTS.availability + g * MATCH_WEIGHTS.goals;
  const pct = (x: number) => Math.round(x * 100);
  return {
    skillFit: pct(s),
    availability: pct(av),
    goals: pct(g),
    overall: pct(overall),
  };
}

/**
 * Ranked suggestions. Someone with zero skill overlap is not a match, however
 * well the schedules line up, so they are excluded rather than shown at a low %.
 */
export function rankMatches(me: User, others: User[]) {
  return others
    .filter((u) => u.id !== me.id)
    .map((u) => ({ user: u, match: scoreMatch(me, u) }))
    .filter((m) => m.match.skillFit > 0)
    .sort((x, y) => y.match.overall - x.match.overall);
}
