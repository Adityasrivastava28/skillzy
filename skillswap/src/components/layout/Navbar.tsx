import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { LogoutButton } from "./LogoutButton";
import { getCurrentUser } from "@/lib/auth/session";
import { countPendingIncoming } from "@/lib/db/exchanges";
import { countPendingIncomingFriendRequests } from "@/lib/db/friends";

// Only pages that actually exist. Add links here as each feature ships.
const links = [
  { href: "/dashboard", label: "Dashboard", auth: true },
  { href: "/explore", label: "Explore", auth: true },
  { href: "/exchanges", label: "Requests", auth: true },
  { href: "/sessions", label: "Schedule", auth: true },
  { href: "/leaderboard", label: "Leaderboard", auth: true },
  { href: "/friends", label: "Friends", auth: true, badgeKey: "friends" as const },
  { href: "/messages", label: "Messages", auth: true },
];

export async function Navbar() {
  const user = await getCurrentUser().catch(() => null); // a DB hiccup must not take down every page
  const [pending, pendingFriends] = user
    ? await Promise.all([
        countPendingIncoming(user.id).catch(() => 0),
        countPendingIncomingFriendRequests(user.id).catch(() => 0),
      ])
    : [0, 0];
  const badgeCounts: Record<string, number> = { friends: pendingFriends };
  return (
    <header className="glass sticky top-0 z-30">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Repeat2 size={18} aria-hidden />
          </span>
          SkillSwap
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.filter((l) => !l.auth || user).map((l) => {
            const count = l.href === "/exchanges" ? pending : l.badgeKey ? badgeCounts[l.badgeKey] : 0;
            return (
              <li key={l.href}>
                <Link href={l.href} className="relative rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-ink">
                  {l.label}
                  {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2" aria-label="Your dashboard">
                <Avatar initials={user.initials} size="sm" />
                <span className="hidden text-sm font-medium sm:block">{user.name.split(" ")[0]}</span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button variant="ghost" href="/login">Log in</Button>
              <Button href="/signup">Get started</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
