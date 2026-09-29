import { cn } from "@/lib/cn";

const tones = ["bg-primary", "bg-secondary", "bg-accent", "bg-violet-500", "bg-rose-500"];

export function Avatar({ initials, size = "md", className }: { initials: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const tone = tones[(initials.charCodeAt(0) + initials.charCodeAt(1 % initials.length)) % tones.length];
  const dims = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" }[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", tone, dims, className)}>
      {initials}
    </span>
  );
}
