import { Card } from "@/components/ui/Card";
import { xpBreakdown } from "@/lib/gamification";
import type { User } from "@/lib/types";

const ROWS = [
  { key: "fromSessions" as const, label: "Sessions completed" },
  { key: "fromSwaps" as const, label: "Swaps completed" },
  { key: "firstSwapBonus" as const, label: "First-swap bonus" },
];

/** Exactly where a user's XP total came from — ties out to `xp` since these are the only two XP sources. */
export function XpBreakdownCard({ user }: { user: User }) {
  const breakdown = xpBreakdown(user);
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">XP breakdown</h2>
      <div className="space-y-2">
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center justify-between text-sm">
            <span className="text-muted">{r.label}</span>
            <span className="font-semibold text-ink">+{breakdown[r.key]}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm">
          <span className="font-semibold text-ink">Total XP</span>
          <span className="font-semibold text-primary">{breakdown.total}</span>
        </div>
      </div>
    </Card>
  );
}
