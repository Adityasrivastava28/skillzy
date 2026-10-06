import { listExchangesForUser } from "@/lib/db/exchanges";
import { withPeers } from "@/lib/exchange-view";
import type { ScheduledSession } from "@/lib/types";

/**
 * Flattens every session out of every exchange the user is part of (any status,
 * so past swaps still show their session history) into one list for a unified
 * schedule view, with the peer and which-skill-is-which attached per session.
 */
export async function listScheduledSessions(userId: string): Promise<ScheduledSession[]> {
  const exchanges = await withPeers(await listExchangesForUser(userId), userId);
  const sessions: ScheduledSession[] = [];
  for (const ex of exchanges) {
    const iTeach = ex.viewerRole === "from" ? ex.offerSkill : ex.wantSkill;
    const iLearn = ex.viewerRole === "from" ? ex.wantSkill : ex.offerSkill;
    for (const s of ex.sessions) {
      sessions.push({ ...s, exchangeId: ex.id, peer: ex.peer, iTeach, iLearn });
    }
  }
  sessions.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  return sessions;
}
