import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { rateAndMaybeComplete } from "@/lib/db/exchanges";
import { ratingSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Exchange not found",
  NOT_ACTIVE: "This exchange isn't active",
  NO_COMPLETED_SESSION: "Complete at least one session together before closing this swap",
  ALREADY_RATED: "You've already rated this exchange",
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const parsed = ratingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const { exchange, error } = await rateAndMaybeComplete(id, userId, parsed.data);
    if (error) {
      const status = error === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json({ error: ERROR_MESSAGES[error] ?? "Can't close this exchange" }, { status });
    }
    return NextResponse.json({ exchange });
  } catch (e) {
    return handleError(e, "complete exchange");
  }
}
