import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { proposeSession } from "@/lib/db/exchanges";
import { sessionProposalSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const parsed = sessionProposalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (new Date(parsed.data.scheduledAt).getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: "Pick a time in the future" }, { status: 400 });
  }

  try {
    const exchange = await proposeSession(id, userId, parsed.data);
    if (!exchange) {
      return NextResponse.json({ error: "Can't schedule a session on this exchange right now" }, { status: 409 });
    }
    return NextResponse.json({ exchange }, { status: 201 });
  } catch (e) {
    return handleError(e, "propose session");
  }
}
