import { NextResponse } from "next/server";
import { DbNotConfiguredError } from "./db";

/** Turn an unexpected failure into a clean JSON response (never leak internals). */
export function handleError(e: unknown, what: string) {
  if (e instanceof DbNotConfiguredError) {
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
  console.error(`${what} failed`, e);
  const name = (e as Error)?.name ?? "";
  if (name.startsWith("MongoServerSelection") || name.startsWith("MongooseServerSelection") || name.startsWith("MongoNetwork")) {
    return NextResponse.json({ error: "Can't reach the database right now. Please try again shortly." }, { status: 503 });
  }
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export const tooMany = () =>
  NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
