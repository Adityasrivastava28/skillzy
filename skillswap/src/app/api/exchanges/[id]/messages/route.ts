import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getExchangeById, listMessages, sendMessage } from "@/lib/db/exchanges";
import { messageSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";
import { clientIp, rateLimit } from "@/lib/rate-limit";

async function assertParticipant(id: string, userId: string) {
  const exchange = await getExchangeById(id);
  if (!exchange || (exchange.fromUserId !== userId && exchange.toUserId !== userId)) return null;
  return exchange;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  try {
    if (!(await assertParticipant(id, userId))) {
      return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    }
    const messages = await listMessages(id);
    return NextResponse.json({ messages });
  } catch (e) {
    return handleError(e, "list messages");
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const parsed = messageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const exchange = await assertParticipant(id, userId);
    if (!exchange) return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    if (exchange.status === "declined" || exchange.status === "cancelled") {
      return NextResponse.json({ error: "This exchange is closed" }, { status: 409 });
    }
    if (!(await rateLimit(`message:${clientIp(req)}`, 60, 60))) {
      return NextResponse.json({ error: "You're sending messages too fast." }, { status: 429 });
    }

    const message = await sendMessage(id, userId, parsed.data.text);
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return handleError(e, "send message");
  }
}
