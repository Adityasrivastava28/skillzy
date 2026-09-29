import { cn } from "@/lib/cn";

export const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Field({
  label, id, className, ...props
}: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <input id={id} name={id} className={cn(inputCls, className)} {...props} />
    </div>
  );
}
