import { cn } from "@/lib/cn";

export function SkillChip({ label, tone = "teach" }: { label: string; tone?: "teach" | "learn" }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        tone === "teach" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700",
      )}
    >
      {label}
    </span>
  );
}
