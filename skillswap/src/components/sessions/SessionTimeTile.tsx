const WEEKDAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * A calendar-style date tile — the one bold, memorable element in a session
 * row. Deliberately neutral (no status color) so it reads as "when", while
 * SessionStatusBadge carries "what's happening" elsewhere in the row.
 */
export function SessionTimeTile({ iso }: { iso: string }) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-surface">
      <span className="text-[10px] font-semibold tracking-wide text-muted">{WEEKDAY[d.getDay()]}</span>
      <span className="font-heading text-xl font-semibold leading-none text-ink">{d.getDate()}</span>
      <span className="mt-0.5 text-[10px] text-muted">{time}</span>
    </div>
  );
}
