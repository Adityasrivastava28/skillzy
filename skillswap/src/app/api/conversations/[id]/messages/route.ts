import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getConversationById, listDirectMessages, markConversationRead, sendDirectMessage } from "@/lib/db/messages";
import { areFriends } from "@/lib/db/friends";
import { directMessageSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";
import { clientIp, rateLimit } from "@/lib/rate-limit";

async function assertParticipant(id: string, userId: string) {
  const conversation = await getConversationById(id);
  if (!conversation || (conversation.userAId !== userId && conversation.userBId !== userId)) return null;
  return conversation;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  try {
    if (!(await assertParticipant(id, userId))) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    const messages = await listDirectMessages(id);
    await markConversationRead(id, userId);
    return NextResponse.json({ messages });
  } catch (e) {
    return handleError(e, "list direct messages");
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const parsed = directMessageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const conversation = await assertParticipant(id, userId);
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // Unfriending closes the conversation to new messages, same as a declined/cancelled exchange.
    const peerId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;
    if (!(await areFriends(userId, peerId))) {
      return NextResponse.json({ error: "You're no longer friends with this person" }, { status: 409 });
    }

    if (!(await rateLimit(`dm:${clientIp(req)}`, 60, 60))) {
      return NextResponse.json({ error: "You're sending messages too fast." }, { status: 429 });
    }

    const message = await sendDirectMessage(id, userId, parsed.data.text);
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return handleError(e, "send direct message");
  }
}
