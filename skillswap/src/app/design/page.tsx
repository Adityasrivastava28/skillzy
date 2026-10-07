import { Star, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { SkillChip } from "@/components/ui/SkillChip";
import { MentorCard } from "@/components/ui/MentorCard";
import { MatchScore } from "@/components/ui/MatchRing";
import { scoreMatch } from "@/lib/match";
import type { User } from "@/lib/types";

const colors = [
  ["Primary", "#2563EB", "bg-primary"],
  ["Secondary", "#10B981", "bg-secondary"],
  ["Accent", "#F59E0B", "bg-accent"],
  ["Surface", "#F8FAFC", "bg-surface border border-line"],
];

export const metadata = { title: "Design System — SkillSwap" };

// Sample data for component previews only. Not real users.
const base = { rating: 0, exchanges: 0, sessionsCompleted: 0, level: 1, xp: 0, streak: 0, badges: 0 };
const sampleA: User = { ...base, id: "a", name: "Sample Learner", initials: "SL", headline: "Sample profile", canTeach: ["Python"], wants: ["UI/UX Design"], availability: ["Tue-eve", "Sat-morn"], goals: ["portfolio"] };
const sampleB: User = { ...base, id: "b", name: "Sample Mentor", initials: "SM", headline: "Sample profile", canTeach: ["UI/UX Design"], wants: ["Python"], availability: ["Tue-eve", "Sun-eve"], goals: ["portfolio"] };

export default function DesignPage() {
  const top = { user: sampleB, match: scoreMatch(sampleA, sampleB) };
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 py-12">
      <header>
        <h1 className="text-4xl font-semibold">Design System</h1>
        <p className="mt-2 text-muted">Tokens and components from the high-fidelity prototype. Previews use sample data.</p>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Colour</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {colors.map(([n, hex, cls]) => (
            <div key={n}>
              <div className={`h-20 rounded-2xl ${cls}`} />
              <p className="mt-2 text-sm font-semibold">{n}</p>
              <p className="text-xs text-muted">{hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Type</h2>
        <Card>
          <p className="font-heading text-3xl font-semibold">Poppins — headings</p>
          <p className="mt-2">Inter — body text, labels and interface copy.</p>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Buttons & chips</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <SkillChip label="Python" tone="teach" />
          <SkillChip label="UI/UX Design" tone="learn" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Stats & match score</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Sessions" value="12" />
          <StatCard label="XP" value="340" icon={<Star size={20} />} />
          <StatCard label="Day streak" value="5" icon={<Flame size={20} />} />
          <Card className="flex items-center justify-center"><MatchScore match={top.match} /></Card>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Mentor card</h2>
        <div className="max-w-sm"><MentorCard user={top.user} match={top.match} /></div>
      </section>
    </div>
  );
}
