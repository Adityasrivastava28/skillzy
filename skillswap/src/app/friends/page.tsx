import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listFriendRequestsForUser } from "@/lib/db/friends";
import { withFriendPeers } from "@/lib/friend-view";
import { FriendsPanel } from "@/components/friends/FriendsPanel";

export const metadata = { title: "Friends — SkillSwap" };
export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const requests = await withFriendPeers(await listFriendRequestsForUser(me.id), me.id);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Friends</h1>
        <p className="mt-1 text-muted">People you&apos;ve connected with, outside of any swap.</p>
      </header>
      <FriendsPanel requests={requests} />
    </div>
  );
}
