import mongoose from "mongoose";
import { connect } from "./db/mongo";

let ttlEnsured = false;

/**
 * Fixed-window rate limiter backed by MongoDB, so limits hold across
 * multiple server instances (serverless-safe). Returns true if allowed.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  await connect();
  const col = mongoose.connection.collection("ratelimits");

  if (!ttlEnsured) {
    ttlEnsured = true;
    // Expired buckets are cleaned up automatically. Best-effort: harmless if unsupported.
    await col.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  }

  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const doc = await col.findOneAndUpdate(
    { _id: `${key}:${bucket}` as unknown as mongoose.Types.ObjectId },
    { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date((bucket + 1) * windowSec * 1000 + 60_000) } },
    { upsert: true, returnDocument: "after" },
  );
  return (doc?.count ?? 1) <= limit;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
