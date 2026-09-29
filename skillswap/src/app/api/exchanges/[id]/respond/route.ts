import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { respondToExchange } from "@/lib/db/exchanges";
import { exchangeRespondSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const parsed = exchangeRespondSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const exchange = await respondToExchange(id, userId, parsed.data.action);
    if (!exchange) {
      return NextResponse.json({ error: "That request can't be updated (wrong status, or not yours)" }, { status: 409 });
    }
    return NextResponse.json({ exchange });
  } catch (e) {
    return handleError(e, "respond to exchange");
  }
}
