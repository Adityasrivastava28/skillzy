import { Star } from "lucide-react";
import type { MatchBreakdown, User } from "@/lib/types";
import { Card } from "./Card";
import { Avatar } from "./Avatar";
import { SkillChip } from "./SkillChip";
import { MatchScore } from "./MatchRing";

export function MentorCard({ user, match, action }: { user: User; match?: MatchBreakdown; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar initials={user.initials} />
          <div>
            <h3 className="text-base font-semibold leading-tight">{user.name}</h3>
            <p className="text-xs text-muted">{user.headline}</p>
          </div>
        </div>
        {match && <MatchScore match={match} />}
      </div>

      <div className="flex items-center gap-1 text-xs text-muted">
        {user.exchanges > 0 ? (
          <>
            <Star size={14} className="fill-accent text-accent" aria-hidden />
            <span className="font-semibold text-ink">{user.rating}</span>
            <span>· {user.exchanges} {user.exchanges === 1 ? "exchange" : "exchanges"}</span>
          </>
        ) : (
          <span>New member</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 text-[11px] font-medium uppercase tracking-wide text-muted">Teaches</span>
          {user.canTeach.map((s) => <SkillChip key={s} label={s} tone="teach" />)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 text-[11px] font-medium uppercase tracking-wide text-muted">Wants</span>
          {user.wants.map((s) => <SkillChip key={s} label={s} tone="learn" />)}
        </div>
      </div>

      {action && <div className="mt-auto">{action}</div>}
    </Card>
  );
}
