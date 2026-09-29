import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { handleError, tooMany } from "@/lib/api-error";

export async function POST(req: Request) {
  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  try {
    const repo = await getUserRepo();
    if (!(await rateLimit(`signup:${clientIp(req)}`, 10, 60 * 60))) return tooMany();

    const user = await repo.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
    await createSession(user.id);
    return NextResponse.json({ user: toPublic(user), onboarded: user.onboarded }, { status: 201 });
  } catch (e) {
    if ((e as Error).message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return handleError(e, "signup");
  }
}
