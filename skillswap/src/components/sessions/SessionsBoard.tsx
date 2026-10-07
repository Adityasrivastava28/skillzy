"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Ban, ArrowUpRight, CalendarX2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SkillChip } from "@/components/ui/SkillChip";
import { SessionStatusBadge, accentBorder } from "./SessionStatusBadge";
import { SessionTimeTile } from "./SessionTimeTile";
import { CelebrationModal, type Celebration } from "@/components/gamification/CelebrationModal";
import { api } from "@/lib/api";
import type { ScheduledSession } from "@/lib/types";

function dayHeading(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
] as const;

function SessionRow({ s, me, onCelebrate }: { s: ScheduledSession; me: string; onCelebrate: (c: Celebration) => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(path: "respond" | "complete", body?: object) {
    setBusy(true);
    setError(null);
    const res = await api<{ statsEvent?: Celebration }>(`/api/exchanges/${s.exchangeId}/sessions/${s.id}/${path}`, "POST", body ?? {});
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (res.data.statsEvent) onCelebrate(res.data.statsEvent);
    router.refresh();
  }

  const proposedByMe = s.proposedBy === me;
  const iCompleted = s.completedBy.includes(me);
  const resolved = s.status === "completed" || s.status === "declined" || s.status === "cancelled";

  return (
    <Card className={`border-l-[3px] p-4 ${accentBorder(s.status)} ${resolved ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-4">
        <SessionTimeTile iso={s.scheduledAt} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Avatar initials={s.peer.initials} size="sm" />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-ink">{s.peer.name}</span>
                <span className="text-xs text-muted">{s.durationMinutes} min · learning <SkillChip label={s.iLearn} tone="learn" /></span>
              </div>
            </div>
            <SessionStatusBadge status={s.status} />
          </div>

          {s.note && <p className="mt-2.5 text-sm text-muted">“{s.note}”</p>}
          {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.status === "proposed" && !proposedByMe && (
              <>
                <Button onClick={() => act("respond", { action: "confirm" })} disabled={busy}>
                  <Check size={14} aria-hidden /> Confirm
                </Button>
                <Button variant="outline" onClick={() => act("respond", { action: "decline" })} disabled={busy}>
                  <X size={14} aria-hidden /> Decline
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
                <Button variant={iCompleted ? "ghost" : "primary"} onClick={() => act("complete")} disabled={busy || iCompleted}>
                  <Check size={14} aria-hidden /> {iCompleted ? "Waiting for them to confirm" : "Mark as done"}
                </Button>
                <Button variant="ghost" onClick={() => act("respond", { action: "cancel" })} disabled={busy}>
                  <Ban size={14} aria-hidden /> Cancel
                </Button>
              </>
            )}
            {s.status === "completed" && <span className="text-xs font-medium text-emerald-700">Both confirmed · +15 XP each</span>}

            <Link href={`/exchanges/${s.exchangeId}`} className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Open swap <ArrowUpRight size={13} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <CalendarX2 size={28} className="text-slate-300" aria-hidden />
      <p className="text-sm text-muted">{text}</p>
    </Card>
  );
}

export function SessionsBoard({ sessions, me }: { sessions: ScheduledSession[]; me: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upcoming");
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const isLive = (s: ScheduledSession) => s.status === "proposed" || s.status === "confirmed";
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
      const key = dayHeading(s.scheduledAt);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [list]);

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-soft w-fit">
        {TABS.map((t) => {
          const count = t.id === "upcoming" ? upcoming.length : past.length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? "bg-primary text-white" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {count > 0 && <span className={`ml-1.5 ${tab === t.id ? "text-blue-100" : "text-slate-400"}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState text={tab === "upcoming" ? "Nothing scheduled. Open an active swap to propose a session." : "No past sessions yet."} />
      ) : (
        <div className="space-y-7">
          {[...grouped.entries()].map(([day, items]) => (
            <div key={day}>
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="font-heading text-base font-semibold text-ink">{day}</h2>
                <div className="h-px flex-1 bg-line" />
              </div>
              <div className="space-y-3">
                {items.map((s) => <SessionRow key={`${s.exchangeId}-${s.id}`} s={s} me={me} onCelebrate={setCelebration} />)}
              </div>
            </div>
          ))}
        </div>
      )}
      {celebration && <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />}
    </div>
  );
}
