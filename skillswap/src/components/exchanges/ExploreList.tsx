"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { inputCls } from "@/components/forms/Field";
import { Card } from "@/components/ui/Card";
import { MentorCard } from "@/components/ui/MentorCard";
import { RequestButton } from "./RequestButton";
import { FriendButton } from "@/components/friends/FriendButton";
import type { FriendRequestWithPeer, User } from "@/lib/types";

export function ExploreList({ me, people, friendRequests }: { me: User; people: User[]; friendRequests: FriendRequestWithPeer[] }) {
  const [q, setQ] = useState("");
  const requestFor = (peerId: string) => friendRequests.find((r) => r.peer.id === peerId);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return people;
    return people.filter((p) =>
      [p.name, p.headline, ...p.canTeach, ...p.wants].some((s) => s.toLowerCase().includes(query)),
    );
  }, [q, people]);

  return (
    <div>
      <div className="relative mb-8 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          className={`${inputCls} pl-10`}
          placeholder="Search by name or skill…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search people by name or skill"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center text-sm text-muted">
          {people.length === 0 ? "No one else has finished their profile yet. Check back soon." : "No one matches that search."}
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <MentorCard
              key={p.id}
              user={p}
              action={
                <div className="space-y-2">
                  <RequestButton me={me} peer={p} />
                  <FriendButton peer={p} request={requestFor(p.id)} />
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
