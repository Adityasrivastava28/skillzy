import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { listScheduledSessions } from "@/lib/sessions-view";
import { handleError } from "@/lib/api-error";

/** All sessions across every one of the user's exchanges, flattened for a single schedule view. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const sessions = await listScheduledSessions(userId);
    return NextResponse.json({ sessions });
  } catch (e) {
    return handleError(e, "list sessions");
  }
}
