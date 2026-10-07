import { Repeat2 } from "lucide-react";

/**
 * Next.js shows this the INSTANT a navigation starts (it's a loading.tsx
 * boundary), before any data has loaded — so a click always gets immediate
 * visible feedback instead of a frozen screen that looks unresponsive.
 */
export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-5 py-20">
      <span className="flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-line border-t-primary">
        <span className="sr-only">Loading</span>
      </span>
      {label && <p className="flex items-center gap-1.5 text-sm text-muted"><Repeat2 size={14} aria-hidden /> {label}</p>}
    </div>
  );
}
