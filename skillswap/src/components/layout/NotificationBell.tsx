"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Inbox, MessageCircle, MessageSquareText, UserPlus } from "lucide-react";

export interface NotificationItem {
  key: string;
  label: string;
  count: number;
  href: string;
  icon: "requests" | "friends" | "messages" | "chats";
}

const ICONS = { requests: Inbox, friends: UserPlus, messages: MessageCircle, chats: MessageSquareText };

/**
 * Real notifications only — every count here comes straight from stored
 * data (pending requests, unread messages), computed server-side by the
 * Navbar and just rendered here. Nothing is invented client-side.
 */
export function NotificationBell({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = items.reduce((sum, i) => sum + i.count, 0);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = items.filter((i) => i.count > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
      >
        <Bell size={18} aria-hidden />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-72 rounded-xl border border-line bg-white p-2 shadow-lift">
          {active.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <div className="space-y-1">
              {active.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-surface"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-primary">
                      <Icon size={15} aria-hidden />
                    </span>
                    <span className="flex-1 text-ink">{item.label}</span>
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">{item.count}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
