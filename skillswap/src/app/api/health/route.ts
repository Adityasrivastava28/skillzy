import { NextResponse } from "next/server";
import { getUserRepo } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Open /api/health to confirm the app can reach its database. */
export async function GET() {
  try {
    await (await getUserRepo()).health();
    return NextResponse.json({ ok: true, database: "up" });
  } catch (e) {
    return NextResponse.json({ ok: false, database: "down", reason: (e as Error).message }, { status: 503 });
  }
}
