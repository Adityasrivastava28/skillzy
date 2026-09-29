import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublic } from "@/lib/db/repo";
import { handleError } from "@/lib/api-error";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    return NextResponse.json({ user: toPublic(user), onboarded: user.onboarded });
  } catch (e) {
    return handleError(e, "me");
  }
}
