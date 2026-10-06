"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Ban, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SkillChip } from "@/components/ui/SkillChip";
import { api } from "@/lib/api";
import type { FriendRequestWithPeer } from "@/lib/types";

const TABS = [
  { id: "friends", label: "Friends" },
  { id: "incoming", label: "Requests" },
  { id: "sent", label: "Sent" },
] as const;

function Row({ req }: { req: FriendRequestWithPeer }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline" | "cancel") {
    setBusy(true);
    setError(null);
    const res = await api(`/api/friends/${req.id}/respond`, "POST", { action });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function message() {
    setBusy(true);
    setError(null);
    const res = await api<{ conversationId: string }>(`/api/conversations/with/${req.peer.id}`, "GET");
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.push(`/messages/${res.data.conversationId}`);
  }

  const isIncomingPending = req.status === "pending" && req.viewerRole === "to";
  const isOutgoingPending = req.status === "pending" && req.viewerRole === "from";

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar initials={req.peer.initials} />
        <div>
          <p className="font-semibold">{req.peer.name}</p>
          <p className="text-xs text-muted">{req.peer.headline}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {req.peer.canTeach.slice(0, 3).map((s) => <SkillChip key={s} label={s} tone="teach" />)}
          </div>
          {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isIncomingPending && (
          <>
            <Button variant="outline" onClick={() => respond("decline")} disabled={busy}>
              <X size={15} aria-hidden /> {busy ? "…" : "Decline"}
            </Button>
            <Button onClick={() => respond("accept")} disabled={busy}>
              <Check size={15} aria-hidden /> {busy ? "…" : "Accept"}
            </Button>
          </>
        )}
        {isOutgoingPending && (
          <Button variant="outline" onClick={() => respond("cancel")} disabled={busy}>
            <Ban size={15} aria-hidden /> {busy ? "…" : "Cancel"}
          </Button>
        )}
        {req.status === "accepted" && (
          <Button variant="outline" onClick={message} disabled={busy}>
            <MessageCircle size={15} aria-hidden /> Message
          </Button>
        )}
      </div>
    </Card>
  );
}

export function FriendsPanel({ requests }: { requests: FriendRequestWithPeer[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("friends");

  const grouped = useMemo(
    () => ({
      friends: requests.filter((r) => r.status === "accepted"),
      incoming: requests.filter((r) => r.status === "pending" && r.viewerRole === "to"),
      sent: requests.filter((r) => r.status === "pending" && r.viewerRole === "from"),
    }),
    [requests],
  );

  const list = grouped[tab];

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-soft w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-primary text-white" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {grouped[t.id].length > 0 && (
              <span className={`ml-1.5 ${tab === t.id ? "text-blue-100" : "text-slate-400"}`}>{grouped[t.id].length}</span>
            )}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="text-center text-sm text-muted">
          {tab === "friends" ? "No friends yet. Add some from Explore." : "Nothing here yet."}
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => <Row key={r.id} req={r} />)}
        </div>
      )}
    </div>
  );
}
