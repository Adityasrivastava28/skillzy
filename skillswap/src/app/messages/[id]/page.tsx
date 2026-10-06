import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationById, listDirectMessages } from "@/lib/db/messages";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { DirectChat } from "@/components/messages/DirectChat";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const { id } = await params;

  const conversation = await getConversationById(id);
  if (!conversation || (conversation.userAId !== me.id && conversation.userBId !== me.id)) notFound();

  const peerId = conversation.userAId === me.id ? conversation.userBId : conversation.userAId;
  const [peer, messages] = await Promise.all([
    (await getUserRepo()).findById(peerId),
    listDirectMessages(id),
  ]);
  if (!peer) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <DirectChat conversationId={id} me={toPublic(me)} peer={toPublic(peer)} initialMessages={messages} />
    </div>
  );
}
