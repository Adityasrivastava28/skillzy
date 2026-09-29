import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { respondToSession } from "@/lib/db/exchanges";
import { sessionRespondSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id, sessionId } = await params;

  const parsed = sessionRespondSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const exchange = await respondToSession(id, sessionId, userId, parsed.data.action);
    if (!exchange) {
      return NextResponse.json({ error: "That session can't be updated" }, { status: 409 });
    }
    return NextResponse.json({ exchange });
  } catch (e) {
    return handleError(e, "respond to session");
  }
}
