import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Leaderboard — SkillSwap" };
export const dynamic = "force-dynamic";

const MEDAL = ["text-amber-500", "text-slate-400", "text-amber-700"];

export default async function LeaderboardPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const top = (await (await getUserRepo()).listTopByXp(50)).map(toPublic);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Leaderboard</h1>
        <p className="mt-1 text-muted">Ranked by real XP earned from completed sessions and swaps.</p>
      </header>

      {top.length === 0 ? (
        <Card className="text-center text-sm text-muted">No ranked members yet.</Card>
      ) : (
        <Card className="divide-y divide-line p-0">
          {top.map((u, i) => {
            const mine = u.id === me.id;
            return (
              <div
                key={u.id}
                className={`flex items-center gap-4 px-4 py-3 ${mine ? "bg-blue-50/60" : ""}`}
              >
                <span className={`w-6 text-center text-sm font-bold ${i < 3 ? MEDAL[i] : "text-muted"}`}>
                  {i < 3 ? <Trophy size={16} className="mx-auto" aria-hidden /> : i + 1}
                </span>
                <Avatar initials={u.initials} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{u.name}{mine ? " (you)" : ""}</p>
                  <p className="text-xs text-muted">Level {u.level} · {u.badges} badge{u.badges === 1 ? "" : "s"}</p>
                </div>
                <span className="text-sm font-bold text-primary">{u.xp} XP</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
