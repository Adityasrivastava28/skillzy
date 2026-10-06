import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { areFriends } from "@/lib/db/friends";
import { getOrCreateConversation } from "@/lib/db/messages";
import { handleError } from "@/lib/api-error";

/** Opens (or creates) the DM conversation with a friend. Only works if you're actually friends. */
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { userId: peerId } = await params;

  if (peerId === userId) {
    return NextResponse.json({ error: "You can't message yourself" }, { status: 400 });
  }

  try {
    if (!(await areFriends(userId, peerId))) {
      return NextResponse.json({ error: "You're not friends with that person" }, { status: 403 });
    }
    const conversation = await getOrCreateConversation(userId, peerId);
    return NextResponse.json({ conversationId: conversation.id });
  } catch (e) {
    return handleError(e, "open conversation");
  }
}
