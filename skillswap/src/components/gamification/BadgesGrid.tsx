import { Handshake, BookOpen, GraduationCap, Repeat2, Star, Flame, Trophy, Sparkles, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { BADGES, earnedBadges, type BadgeDef } from "@/lib/gamification";
import type { User } from "@/lib/types";

const ICONS: Record<BadgeDef["icon"], React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  Handshake, BookOpen, GraduationCap, Repeat2, Star, Flame, Trophy, Sparkles,
};

/** Every badge, earned or not — earned ones from real stats, locked ones shown as a goal to work toward. */
export function BadgesGrid({ user }: { user: User }) {
  const earnedIds = new Set(earnedBadges(user).map((b) => b.id));
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BADGES.map((b) => {
        const earned = earnedIds.has(b.id);
        const Icon = ICONS[b.icon];
        return (
          <Card
            key={b.id}
            className={`flex flex-col items-center gap-2 p-4 text-center transition ${earned ? "" : "opacity-50"}`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                earned ? "bg-amber-50 text-accent" : "bg-slate-100 text-slate-400"
              }`}
            >
              {earned ? <Icon size={22} aria-hidden /> : <Lock size={18} aria-hidden />}
            </span>
            <div>
              <p className="text-xs font-semibold text-ink">{b.label}</p>
              <p className="mt-0.5 text-[11px] text-muted">{b.description}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
