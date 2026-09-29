import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listExchangesForUser } from "@/lib/db/exchanges";
import { withPeers } from "@/lib/exchange-view";
import { ExchangeInbox } from "@/components/exchanges/ExchangeInbox";

export const metadata = { title: "Requests — SkillSwap" };
export const dynamic = "force-dynamic";

export default async function ExchangesPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const exchanges = await withPeers(await listExchangesForUser(me.id), me.id);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Requests</h1>
        <p className="mt-1 text-muted">Accept a request to start chatting and schedule your first session.</p>
      </header>
      <ExchangeInbox exchanges={exchanges} viewerId={me.id} />
    </div>
  );
}
