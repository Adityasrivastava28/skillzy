import Link from "next/link";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { SkillChip } from "@/components/ui/SkillChip";
import type { ScheduledSession } from "@/lib/types";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** A compact read-only preview, used on the dashboard. The full board with actions lives at /sessions. */
export function UpcomingSessions({ sessions }: { sessions: ScheduledSession[] }) {
  if (sessions.length === 0) {
    return <Card className="text-center text-sm text-muted">Nothing scheduled. Open an active swap to propose a session.</Card>;
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <Link key={s.id} href={`/exchanges/${s.exchangeId}`} className="block">
          <Card className="flex items-center justify-between gap-3 transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex items-center gap-3">
              <Avatar initials={s.peer.initials} size="sm" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold"><Clock size={13} aria-hidden /> {fmt(s.scheduledAt)}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <span>with {s.peer.name.split(" ")[0]}</span><span>·</span><SkillChip label={s.iLearn} tone="learn" />
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-muted">{s.status}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
