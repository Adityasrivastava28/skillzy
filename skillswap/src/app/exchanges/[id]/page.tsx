import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getExchangeById, listMessages, markExchangeChatRead } from "@/lib/db/exchanges";
import { withPeers } from "@/lib/exchange-view";
import { toPublic } from "@/lib/db/repo";
import { getCodePad } from "@/lib/db/codepad";
import { ExchangeWorkspace } from "@/components/exchanges/ExchangeWorkspace";

export const dynamic = "force-dynamic";

export default async function ExchangePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const { id } = await params;

  const exchange = await getExchangeById(id);
  if (!exchange || (exchange.fromUserId !== me.id && exchange.toUserId !== me.id)) notFound();

  const [withPeer] = await withPeers([exchange], me.id);
  const [messages, codePad] = await Promise.all([listMessages(id), getCodePad(id)]);
  await markExchangeChatRead(id, me.id);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <ExchangeWorkspace exchange={withPeer} me={toPublic(me)} initialMessages={messages} initialCodePad={codePad} />
    </div>
  );
}
