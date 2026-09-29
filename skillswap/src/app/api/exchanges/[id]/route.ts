import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getExchangeById } from "@/lib/db/exchanges";
import { withPeers } from "@/lib/exchange-view";
import { handleError } from "@/lib/api-error";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  try {
    const exchange = await getExchangeById(id);
    if (!exchange || (exchange.fromUserId !== userId && exchange.toUserId !== userId)) {
      return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    }
    const [withPeer] = await withPeers([exchange], userId);
    return NextResponse.json({ exchange: withPeer });
  } catch (e) {
    return handleError(e, "get exchange");
  }
}
