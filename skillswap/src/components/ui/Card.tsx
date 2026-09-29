import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white p-5 shadow-soft", className)}>
      {children}
    </div>
  );
}
