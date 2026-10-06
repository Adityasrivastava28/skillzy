import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import type { FriendRequestRecord, FriendRequestWithPeer } from "@/lib/types";

/** Attach the other participant's public profile so the UI never has to fetch it separately. */
export async function withFriendPeers(
  requests: FriendRequestRecord[],
  viewerId: string,
): Promise<FriendRequestWithPeer[]> {
  const repo = await getUserRepo();
  const peerIds = [...new Set(requests.map((r) => (r.fromUserId === viewerId ? r.toUserId : r.fromUserId)))];
  const peers = new Map(
    (await Promise.all(peerIds.map((id) => repo.findById(id)))).filter(Boolean).map((u) => [u!.id, toPublic(u!)]),
  );
  return requests
    .filter((r) => peers.has(r.fromUserId === viewerId ? r.toUserId : r.fromUserId))
    .map((r) => {
      const isFrom = r.fromUserId === viewerId;
      return { ...r, peer: peers.get(isFrom ? r.toUserId : r.fromUserId)!, viewerRole: isFrom ? "from" : "to" } as FriendRequestWithPeer;
    });
}
