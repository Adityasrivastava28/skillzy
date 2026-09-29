import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, Star, Trophy, Repeat2, Inbox } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { countPendingIncoming } from "@/lib/db/exchanges";
import { rankMatches } from "@/lib/match";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { SkillChip } from "@/components/ui/SkillChip";
import { MentorCard } from "@/components/ui/MentorCard";
import { Button } from "@/components/ui/Button";
import { RequestButton } from "@/components/exchanges/RequestButton";

export const metadata = { title: "Dashboard — SkillSwap" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const myPublic = toPublic(me);
  const others = (await (await getUserRepo()).listOnboarded(me.id, 50)).map(toPublic);
  const matches = rankMatches(myPublic, others).slice(0, 3);
  const pending = await countPendingIncoming(me.id);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Hi, {me.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-muted">{me.headline}</p>
        </div>
        <div className="flex gap-2">
          {pending > 0 && (
            <Button variant="outline" href="/exchanges">
              <Inbox size={16} aria-hidden /> {pending} pending request{pending === 1 ? "" : "s"}
            </Button>
          )}
          <Button variant="outline" href="/onboarding">Edit profile</Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Level" value={me.level} icon={<Trophy size={20} />} />
        <StatCard label="XP" value={me.xp} icon={<Star size={20} />} />
        <StatCard label="Day streak" value={me.streak} icon={<Flame size={20} />} />
        <StatCard label="Exchanges" value={me.exchanges} icon={<Repeat2 size={20} />} />
      </section>

      <Card className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">You teach</h2>
          <div className="flex flex-wrap gap-2">{me.canTeach.map((s) => <SkillChip key={s} label={s} tone="teach" />)}</div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">You want to learn</h2>
          <div className="flex flex-wrap gap-2">{me.wants.map((s) => <SkillChip key={s} label={s} tone="learn" />)}</div>
        </div>
      </Card>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Suggested matches</h2>
          <Link href="/explore" className="text-sm font-semibold text-primary hover:underline">Explore all</Link>
        </div>
        {matches.length === 0 ? (
          <Card className="text-center text-sm text-muted">No matches yet. Matches appear here as more people join and complete their profiles.</Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {matches.map(({ user, match }) => (
              <MentorCard key={user.id} user={user} match={match} action={<RequestButton me={myPublic} peer={user} />} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
