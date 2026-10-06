import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getExchangeById } from "@/lib/db/exchanges";
import { getCodePad, updateCodePad } from "@/lib/db/codepad";
import { codePadSchema } from "@/lib/validation";
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
    const pad = await getCodePad(id);
    return NextResponse.json({ pad });
  } catch (e) {
    return handleError(e, "get code pad");
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const parsed = codePadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const exchange = await assertParticipant(id, userId);
    if (!exchange) return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    if (!(await rateLimit(`codepad:${clientIp(req)}`, 120, 60))) {
      return NextResponse.json({ error: "You're editing too fast." }, { status: 429 });
    }

    const pad = await updateCodePad(id, userId, parsed.data);
    return NextResponse.json({ pad });
  } catch (e) {
    return handleError(e, "update code pad");
  }
}
