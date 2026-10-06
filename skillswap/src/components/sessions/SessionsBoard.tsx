"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Ban, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SkillChip } from "@/components/ui/SkillChip";
import { api } from "@/lib/api";
import type { ScheduledSession } from "@/lib/types";

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
] as const;

function SessionCard({ s, me }: { s: ScheduledSession; me: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(path: "respond" | "complete", body?: object) {
    setBusy(true);
    setError(null);
    const res = await api(`/api/exchanges/${s.exchangeId}/sessions/${s.id}/${path}`, "POST", body ?? {});
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  const proposedByMe = s.proposedBy === me;
  const iCompleted = s.completedBy.includes(me);

  return (
    <Card className="text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar initials={s.peer.initials} size="sm" />
          <div>
            <p className="flex items-center gap-1.5 font-semibold"><Clock size={14} aria-hidden /> {fmtTime(s.scheduledAt)}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <span>with {s.peer.name.split(" ")[0]}</span><span>·</span><SkillChip label={s.iLearn} tone="learn" />
              <span>{s.durationMinutes} min</span>
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-muted">{s.status}</span>
      </div>
      {s.note && <p className="mt-2 text-xs text-muted">“{s.note}”</p>}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {s.status === "proposed" && !proposedByMe && (
          <>
            <Button variant="outline" onClick={() => act("respond", { action: "decline" })} disabled={busy}>
              <X size={14} aria-hidden /> Decline
            </Button>
            <Button onClick={() => act("respond", { action: "confirm" })} disabled={busy}>
              <Check size={14} aria-hidden /> Confirm
            </Button>
          </>
        )}
        {s.status === "proposed" && proposedByMe && (
          <>
            <span className="text-xs text-muted">Waiting for {s.peer.name.split(" ")[0]} to confirm</span>
            <Button variant="ghost" onClick={() => act("respond", { action: "cancel" })} disabled={busy}>
              <Ban size={14} aria-hidden /> Cancel
            </Button>
          </>
        )}
        {s.status === "confirmed" && (
          <>
            <Button
              variant={iCompleted ? "ghost" : "primary"}
              onClick={() => act("complete")}
              disabled={busy || iCompleted}
            >
              <Check size={14} aria-hidden /> {iCompleted ? "Waiting for them to confirm" : "Mark as done"}
            </Button>
            <Button variant="ghost" onClick={() => act("respond", { action: "cancel" })} disabled={busy}>
              <Ban size={14} aria-hidden /> Cancel
            </Button>
          </>
        )}
        {s.status === "completed" && <span className="text-xs font-medium text-emerald-700">Both confirmed · +15 XP each</span>}
        {(s.status === "declined" || s.status === "cancelled") && <span className="text-xs text-muted capitalize">{s.status}</span>}
        <Link href={`/exchanges/${s.exchangeId}`} className="ml-auto text-xs font-semibold text-primary hover:underline">
          Open swap
        </Link>
      </div>
    </Card>
  );
}

export function SessionsBoard({ sessions, me }: { sessions: ScheduledSession[]; me: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upcoming");

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const isLive = (s: ScheduledSession) => ["proposed", "confirmed"].includes(s.status);
    const upcoming = sessions
      .filter((s) => isLive(s) && new Date(s.scheduledAt) >= now)
      .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
    const past = sessions
      .filter((s) => !isLive(s) || new Date(s.scheduledAt) < now)
      .sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));
    return { upcoming, past };
  }, [sessions]);

  const list = tab === "upcoming" ? upcoming : past;

  const grouped = useMemo(() => {
    const map = new Map<string, ScheduledSession[]>();
    for (const s of list) {
      const key = dayLabel(s.scheduledAt);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [list]);

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
            {(t.id === "upcoming" ? upcoming : past).length > 0 && (
              <span className={`ml-1.5 ${tab === t.id ? "text-blue-100" : "text-slate-400"}`}>{(t.id === "upcoming" ? upcoming : past).length}</span>
            )}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="text-center text-sm text-muted">
          {tab === "upcoming" ? "No sessions scheduled. Open an active swap to propose one." : "No past sessions yet."}
        </Card>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{day}</h2>
              <div className="space-y-3">
                {items.map((s) => <SessionCard key={`${s.exchangeId}-${s.id}`} s={s} me={me} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
