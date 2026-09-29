import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";

const styles: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-lift hover:bg-primary-dark",
  secondary: "bg-secondary text-white hover:brightness-95",
  outline: "border border-line bg-white text-ink hover:border-primary hover:text-primary",
  ghost: "text-muted hover:bg-white hover:text-ink",
};

interface Props {
  variant?: Variant;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
}

export function Button({ variant = "primary", href, className, children, onClick, type = "button", disabled, title }: Props) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    disabled && "pointer-events-none opacity-50",
    styles[variant],
    className,
  );
  if (href) return <Link href={href} className={cls} title={title}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} title={title} className={cls}>{children}</button>;
}
