import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import type { ConversationWithPeer } from "@/lib/types";

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function ConversationList({ conversations, me }: { conversations: ConversationWithPeer[]; me: string }) {
  if (conversations.length === 0) {
    return <Card className="text-center text-sm text-muted">No conversations yet. Add a friend, then message them.</Card>;
  }

  return (
    <div className="space-y-2">
      {conversations.map((c) => (
        <Link key={c.id} href={`/messages/${c.id}`} className="block">
          <Card className="flex items-center gap-3 transition hover:-translate-y-0.5 hover:shadow-lift">
            <Avatar initials={c.peer.initials} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{c.peer.name}</p>
                <span className="shrink-0 text-xs text-muted">{fmt(c.lastMessageAt)}</span>
              </div>
              <p className="truncate text-sm text-muted">
                {c.lastMessage
                  ? `${c.lastMessage.fromUserId === me ? "You: " : ""}${c.lastMessage.text}`
                  : "No messages yet"}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
