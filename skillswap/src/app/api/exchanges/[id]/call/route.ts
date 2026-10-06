import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getExchangeById } from "@/lib/db/exchanges";
import { clearCallSignals, listCallSignals, sendCallSignal } from "@/lib/db/calls";
import { callSignalSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";
import { clientIp, rateLimit } from "@/lib/rate-limit";

async function assertParticipant(id: string, userId: string) {
  const exchange = await getExchangeById(id);
  if (!exchange || (exchange.fromUserId !== userId && exchange.toUserId !== userId)) return null;
  return exchange;
}

/** Poll for new signaling messages. Pass ?after=<signalId> to get only what's new. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const after = new URL(req.url).searchParams.get("after") ?? undefined;

  try {
    if (!(await assertParticipant(id, userId))) {
      return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    }
    const signals = await listCallSignals(id, after);
    return NextResponse.json({ signals });
  } catch (e) {
    return handleError(e, "list call signals");
  }
}

/** Send one piece of WebRTC signaling (an SDP offer/answer or an ICE candidate) to the other participant. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const parsed = callSignalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const exchange = await assertParticipant(id, userId);
    if (!exchange) return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    if (exchange.status !== "accepted") {
      return NextResponse.json({ error: "You can only call inside an active swap" }, { status: 409 });
    }
    if (!(await rateLimit(`call-signal:${clientIp(req)}`, 300, 60))) {
      return NextResponse.json({ error: "Too many signaling messages." }, { status: 429 });
    }

    const signal = await sendCallSignal(id, userId, parsed.data.type, parsed.data.payload);
    return NextResponse.json({ signal }, { status: 201 });
  } catch (e) {
    return handleError(e, "send call signal");
  }
}

/** Clears signaling history once a call ends, so the next call starts clean. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  try {
    if (!(await assertParticipant(id, userId))) {
      return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    }
    await clearCallSignals(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e, "clear call signals");
  }
}
