"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { MatchBreakdown } from "@/lib/types";
import { MATCH_WEIGHTS } from "@/lib/match";

function Bar({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{label} <span className="text-slate-400">({Math.round(weight * 100)}%)</span></span>
        <span className="font-semibold text-ink">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/**
 * Match score with a built-in explanation. Usability testing: 4 of 6 users
 * missed what "Match %" meant, so the breakdown is one tap/hover away.
 */
export function MatchScore({ match }: { match: MatchBreakdown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${match.overall}% match, show how it is calculated`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        {match.overall}% match
        <Info size={14} aria-hidden />
      </button>
      {open && (
        <div role="tooltip" className="absolute right-0 top-full z-20 mt-2 w-64 space-y-3 rounded-xl border border-line bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-ink">Why this score?</p>
          <Bar label="Skill fit" value={match.skillFit} weight={MATCH_WEIGHTS.skillFit} />
          <Bar label="Availability" value={match.availability} weight={MATCH_WEIGHTS.availability} />
          <Bar label="Shared goals" value={match.goals} weight={MATCH_WEIGHTS.goals} />
        </div>
      )}
    </div>
  );
}
