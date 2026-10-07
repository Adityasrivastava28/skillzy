"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Ban, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SkillChip } from "@/components/ui/SkillChip";
import { api } from "@/lib/api";
import type { ExchangeWithPeer } from "@/lib/types";

const TABS = [
  { id: "incoming", label: "Requests" },
  { id: "sent", label: "Sent" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Active",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

function Row({ ex, viewerId }: { ex: ExchangeWithPeer; viewerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline" | "cancel") {
    setBusy(true);
    setError(null);
    const res = await api(`/api/exchanges/${ex.id}/respond`, "POST", { action });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  const isIncomingPending = ex.status === "pending" && ex.viewerRole === "to";
  const isOutgoingPending = ex.status === "pending" && ex.viewerRole === "from";
  const iTeach = ex.viewerRole === "from" ? ex.offerSkill : ex.wantSkill;
  const iLearn = ex.viewerRole === "from" ? ex.wantSkill : ex.offerSkill;

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar initials={ex.peer.initials} />
        <div>
          <p className="font-semibold">{ex.peer.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span>You teach</span>
            <SkillChip label={iTeach} tone="teach" />
            <span>· you learn</span>
            <SkillChip label={iLearn} tone="learn" />
          </div>
          {ex.note && <p className="mt-1.5 text-sm text-muted">“{ex.note}”</p>}
          {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isIncomingPending && (
          <>
            <Button variant="outline" onClick={() => respond("decline")}>
              <X size={15} aria-hidden /> {busy ? "…" : "Decline"}
            </Button>
            <Button onClick={() => respond("accept")}>
              <Check size={15} aria-hidden /> {busy ? "…" : "Accept"}
            </Button>
          </>
        )}
        {isOutgoingPending && (
          <Button variant="outline" onClick={() => respond("cancel")}>
            <Ban size={15} aria-hidden /> {busy ? "…" : "Cancel"}
          </Button>
        )}
        {ex.status === "accepted" && (
          <Button href={`/exchanges/${ex.id}`} className="relative">
            {ex.unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white" aria-hidden />}
            Open <ArrowRight size={15} aria-hidden />
          </Button>
        )}
        {(ex.status === "completed" || ex.status === "declined" || ex.status === "cancelled") && (
          <>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">{STATUS_LABEL[ex.status]}</span>
            <Link href={`/exchanges/${ex.id}`} className="text-sm font-semibold text-primary hover:underline">View</Link>
          </>
        )}
      </div>
    </Card>
  );
}

export function ExchangeInbox({ exchanges, viewerId }: { exchanges: ExchangeWithPeer[]; viewerId: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("incoming");

  const grouped = useMemo(() => {
    return {
      incoming: exchanges.filter((e) => e.status === "pending" && e.viewerRole === "to"),
      sent: exchanges.filter((e) => e.status === "pending" && e.viewerRole === "from"),
      active: exchanges.filter((e) => e.status === "accepted"),
      past: exchanges.filter((e) => ["completed", "declined", "cancelled"].includes(e.status)),
    };
  }, [exchanges]);

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
        <Card className="text-center text-sm text-muted">Nothing here yet.</Card>
      ) : (
        <div className="space-y-3">
          {list.map((ex) => <Row key={ex.id} ex={ex} viewerId={viewerId} />)}
        </div>
      )}
    </div>
  );
}
