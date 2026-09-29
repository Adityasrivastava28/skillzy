import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { handleError, tooMany } from "@/lib/api-error";

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    const repo = await getUserRepo();
    // Per-IP and per-account limits: slows both brute force and credential stuffing.
    const okIp = await rateLimit(`login-ip:${clientIp(req)}`, 20, 15 * 60);
    const okAcct = await rateLimit(`login-email:${email}`, 10, 15 * 60);
    if (!okIp || !okAcct) return tooMany();

    const user = await repo.findByEmail(email);
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ user: toPublic(user), onboarded: user.onboarded });
  } catch (e) {
    return handleError(e, "login");
  }
}
