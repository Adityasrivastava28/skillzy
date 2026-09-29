import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getExchangeById, listMessages } from "@/lib/db/exchanges";
import { withPeers } from "@/lib/exchange-view";
import { toPublic } from "@/lib/db/repo";
import { ExchangeWorkspace } from "@/components/exchanges/ExchangeWorkspace";

export const dynamic = "force-dynamic";

export default async function ExchangePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const { id } = await params;

  const exchange = await getExchangeById(id);
  if (!exchange || (exchange.fromUserId !== me.id && exchange.toUserId !== me.id)) notFound();

  const [withPeer] = await withPeers([exchange], me.id);
  const messages = await listMessages(id);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <ExchangeWorkspace exchange={withPeer} me={toPublic(me)} initialMessages={messages} />
    </div>
  );
}
