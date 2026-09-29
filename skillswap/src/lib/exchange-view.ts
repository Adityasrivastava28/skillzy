import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import type { ExchangeRecord, ExchangeWithPeer } from "@/lib/types";

/** Attach the other participant's public profile so the UI never has to fetch it separately. */
export async function withPeers(exchanges: ExchangeRecord[], viewerId: string): Promise<ExchangeWithPeer[]> {
  const repo = await getUserRepo();
  const peerIds = [...new Set(exchanges.map((e) => (e.fromUserId === viewerId ? e.toUserId : e.fromUserId)))];
  const peers = new Map(
    (await Promise.all(peerIds.map((id) => repo.findById(id)))).filter(Boolean).map((u) => [u!.id, toPublic(u!)]),
  );
  return exchanges
    .filter((e) => peers.has(e.fromUserId === viewerId ? e.toUserId : e.fromUserId))
    .map((e) => {
      const isFrom = e.fromUserId === viewerId;
      return { ...e, peer: peers.get(isFrom ? e.toUserId : e.fromUserId)!, viewerRole: isFrom ? "from" : "to" } as ExchangeWithPeer;
    });
}
