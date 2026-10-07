import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { completeSession } from "@/lib/db/exchanges";
import { handleError } from "@/lib/api-error";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id, sessionId } = await params;

  try {
    const { exchange, statsEvent } = await completeSession(id, sessionId, userId);
    if (!exchange) {
      return NextResponse.json({ error: "That session can't be marked done" }, { status: 409 });
    }
    return NextResponse.json({ exchange, statsEvent });
  } catch (e) {
    return handleError(e, "complete session");
  }
}
