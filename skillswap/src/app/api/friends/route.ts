import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { hasOpenFriendRequest, listFriendRequestsForUser, sendFriendRequest } from "@/lib/db/friends";
import { withFriendPeers } from "@/lib/friend-view";
import { friendRequestSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const requests = await withFriendPeers(await listFriendRequestsForUser(userId), userId);
    return NextResponse.json({ requests });
  } catch (e) {
    return handleError(e, "list friend requests");
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = friendRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { toUserId } = parsed.data;

  if (toUserId === userId) {
    return NextResponse.json({ error: "You can't friend yourself" }, { status: 400 });
  }

  try {
    if (!(await rateLimit(`friend-request:${clientIp(req)}`, 30, 60 * 60))) {
      return NextResponse.json({ error: "Too many requests sent. Please wait a while." }, { status: 429 });
    }

    const repo = await getUserRepo();
    const them = await repo.findById(toUserId);
    if (!them) return NextResponse.json({ error: "That person doesn't exist" }, { status: 404 });

    if (await hasOpenFriendRequest(userId, toUserId)) {
      return NextResponse.json({ error: "You already have a pending request or are already friends" }, { status: 409 });
    }

    const request = await sendFriendRequest(userId, toUserId);
    return NextResponse.json({ request: { ...request, peer: toPublic(them), viewerRole: "from" } }, { status: 201 });
  } catch (e) {
    return handleError(e, "send friend request");
  }
}
