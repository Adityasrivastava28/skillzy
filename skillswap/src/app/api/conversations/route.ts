import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { listConversationsForUser } from "@/lib/db/messages";
import { withConversationPeers } from "@/lib/conversation-view";
import { handleError } from "@/lib/api-error";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const conversations = await withConversationPeers(await listConversationsForUser(userId), userId);
    return NextResponse.json({ conversations });
  } catch (e) {
    return handleError(e, "list conversations");
  }
}
