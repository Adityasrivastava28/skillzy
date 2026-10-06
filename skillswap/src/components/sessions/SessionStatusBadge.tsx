import type { SessionStatus } from "@/lib/types";

const STYLE: Record<SessionStatus, { dot: string; pill: string; label: string }> = {
  proposed: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700", label: "Awaiting confirmation" },
  confirmed: { dot: "bg-primary", pill: "bg-blue-50 text-primary", label: "Confirmed" },
  completed: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", label: "Completed" },
  declined: { dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700", label: "Declined" },
  cancelled: { dot: "bg-slate-400", pill: "bg-slate-100 text-muted", label: "Cancelled" },
};

/** The one consistent way a session's status is shown, wherever a session appears. */
export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const s = STYLE[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}

export function accentBorder(status: SessionStatus) {
  return {
    proposed: "border-l-amber-400",
    confirmed: "border-l-primary",
    completed: "border-l-emerald-400",
    declined: "border-l-rose-300",
    cancelled: "border-l-slate-300",
  }[status];
}
