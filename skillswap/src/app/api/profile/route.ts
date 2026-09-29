import { NextResponse } from "next/server";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { getSessionUserId } from "@/lib/auth/session";
import { profileSchema } from "@/lib/validation";
import { handleError } from "@/lib/api-error";

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  try {
    const updated = await (await getUserRepo()).updateProfile(userId, parsed.data);
    if (!updated) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json({ user: toPublic(updated) });
  } catch (e) {
    return handleError(e, "profile update");
  }
}
