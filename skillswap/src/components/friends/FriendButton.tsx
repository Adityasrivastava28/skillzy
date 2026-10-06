"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check, X, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { FriendRequestWithPeer, User } from "@/lib/types";

/**
 * Shows the right action for wherever this friendship actually stands —
 * never a generic "Add friend" once a real request exists one way or the other.
 */
export function FriendButton({ peer, request }: { peer: User; request?: FriendRequestWithPeer }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(url: string, body?: object) {
    setBusy(true);
    setError(null);
    const res = await api(url, "POST", body ?? {});
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function message() {
    setBusy(true);
    setError(null);
    const res = await api<{ conversationId: string }>(`/api/conversations/with/${peer.id}`, "GET");
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.push(`/messages/${res.data.conversationId}`);
  }

  const hasOpen = request && (request.status === "pending" || request.status === "accepted");

  return (
    <div>
      {!hasOpen && (
        <Button variant="outline" className="w-full" onClick={() => act("/api/friends", { toUserId: peer.id })} disabled={busy}>
          <UserPlus size={15} aria-hidden /> {busy ? "Sending…" : "Add friend"}
        </Button>
      )}

      {request?.status === "pending" && request.viewerRole === "from" && (
        <Button variant="ghost" className="w-full" onClick={() => act(`/api/friends/${request.id}/respond`, { action: "cancel" })} disabled={busy}>
          <Clock size={15} aria-hidden /> {busy ? "…" : "Request sent · Cancel"}
        </Button>
      )}

      {request?.status === "pending" && request.viewerRole === "to" && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => act(`/api/friends/${request.id}/respond`, { action: "accept" })} disabled={busy}>
            <Check size={15} aria-hidden /> Accept
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => act(`/api/friends/${request.id}/respond`, { action: "decline" })} disabled={busy}>
            <X size={15} aria-hidden /> Decline
          </Button>
        </div>
      )}

      {request?.status === "accepted" && (
        <Button variant="outline" className="w-full" onClick={message} disabled={busy}>
          <MessageCircle size={15} aria-hidden /> {busy ? "…" : "Message"}
        </Button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}
