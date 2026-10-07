import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { lastMessageFor } from "@/lib/db/messages";
import type { ConversationRecord, ConversationWithPeer } from "@/lib/types";

/** Attach the other participant's public profile and the latest message, for the conversation list UI. */
export async function withConversationPeers(
  conversations: ConversationRecord[],
  viewerId: string,
): Promise<ConversationWithPeer[]> {
  const repo = await getUserRepo();
  const peerIds = [...new Set(conversations.map((c) => (c.userAId === viewerId ? c.userBId : c.userAId)))];
  const peers = new Map(
    (await Promise.all(peerIds.map((id) => repo.findById(id)))).filter(Boolean).map((u) => [u!.id, toPublic(u!)]),
  );
  const withLast = await Promise.all(
    conversations.map(async (c) => ({ c, lastMessage: await lastMessageFor(c.id) })),
  );
  return withLast
    .filter(({ c }) => peers.has(c.userAId === viewerId ? c.userBId : c.userAId))
    .map(({ c, lastMessage }) => ({
      ...c,
      peer: peers.get(c.userAId === viewerId ? c.userBId : c.userAId)!,
      lastMessage,
      unread: new Date(c.lastMessageAt) > new Date(c.reads[viewerId] ?? 0),
    }));
}
