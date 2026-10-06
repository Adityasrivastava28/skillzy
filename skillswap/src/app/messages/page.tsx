import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listConversationsForUser } from "@/lib/db/messages";
import { withConversationPeers } from "@/lib/conversation-view";
import { ConversationList } from "@/components/messages/ConversationList";

export const metadata = { title: "Messages — SkillSwap" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const conversations = await withConversationPeers(await listConversationsForUser(me.id), me.id);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Messages</h1>
        <p className="mt-1 text-muted">Direct chats with your friends.</p>
      </header>
      <ConversationList conversations={conversations} me={me.id} />
    </div>
  );
}
