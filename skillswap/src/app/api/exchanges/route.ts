import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { createExchange, hasOpenExchange, listExchangesForUser } from "@/lib/db/exchanges";
import { withPeers } from "@/lib/exchange-view";
import { exchangeRequestSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const exchanges = await withPeers(await listExchangesForUser(userId), userId);
    return NextResponse.json({ exchanges });
  } catch (e) {
    return handleError(e, "list exchanges");
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = exchangeRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { toUserId, offerSkill, wantSkill, note } = parsed.data;

  if (toUserId === userId) {
    return NextResponse.json({ error: "You can't send a request to yourself" }, { status: 400 });
  }

  try {
    if (!(await rateLimit(`exchange-create:${clientIp(req)}`, 20, 60 * 60))) {
      return NextResponse.json({ error: "Too many requests sent. Please wait a while." }, { status: 429 });
    }

    const repo = await getUserRepo();
    const [me, them] = await Promise.all([repo.findById(userId), repo.findById(toUserId)]);
    if (!me || !them) return NextResponse.json({ error: "That person doesn't exist" }, { status: 404 });

    // Integrity check: the skills named must actually match what each person listed.
    const norm = (s: string) => s.trim().toLowerCase();
    if (!me.canTeach.some((s) => norm(s) === norm(offerSkill))) {
      return NextResponse.json({ error: "You don't have that skill listed as something you can teach" }, { status: 400 });
    }
    if (!them.canTeach.some((s) => norm(s) === norm(wantSkill))) {
      return NextResponse.json({ error: "They don't teach that skill" }, { status: 400 });
    }

    if (await hasOpenExchange(userId, toUserId)) {
      return NextResponse.json({ error: "You already have an open request with this person" }, { status: 409 });
    }

    const exchange = await createExchange({ fromUserId: userId, toUserId, offerSkill, wantSkill, note });
    return NextResponse.json({ exchange: { ...exchange, peer: toPublic(them), viewerRole: "from" } }, { status: 201 });
  } catch (e) {
    return handleError(e, "create exchange");
  }
}
