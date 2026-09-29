import mongoose, { Schema } from "mongoose";
import type { UserRecord } from "@/lib/types";
import { initialsOf, type UserRepo } from "./repo";

type Cache = { promise?: Promise<typeof mongoose> };
const g = globalThis as unknown as { __ssMongo?: Cache };

/**
 * One shared connection per server process (survives hot reloads).
 * Indexes are created once after connecting, so the unique-email
 * guarantee holds before the first write.
 */
export function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  g.__ssMongo ??= {};
  g.__ssMongo.promise ??= mongoose
    .connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 })
    .then(async (m) => {
      await UserModel.init();
      return m;
    })
    .catch((e) => {
      g.__ssMongo = {}; // allow a retry on the next request instead of caching the failure
      throw e;
    });
  return g.__ssMongo.promise;
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    initials: String,
    headline: { type: String, default: "" },
    canTeach: { type: [String], default: [] },
    wants: { type: [String], default: [] },
    availability: { type: [String], default: [] },
    goals: { type: [String], default: [] },
    // rating is derived from ratingSum/ratingCount, both updated only when a real exchange completes.
    rating: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    exchanges: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    badges: { type: Number, default: 0 },
    onboarded: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);

/** XP needed scales up each level, so early levels come quickly. */
export function levelForXp(xp: number) {
  return Math.floor(xp / 100) + 1;
}

/**
 * The only place user stats change, and only ever from something that really
 * happened: a completed session (XP) or a completed exchange (rating + count).
 * Read-modify-save rather than an atomic update because the new rating average
 * and level both depend on the document's current values.
 */
export async function adjustUserStats(
  userId: string,
  delta: { xp?: number; exchanges?: number; addRating?: number },
) {
  await connect();
  if (!validId(userId)) return;
  const doc = await UserModel.findById(userId);
  if (!doc) return;
  if (delta.xp) {
    doc.set("xp", (doc.get("xp") as number) + delta.xp);
    doc.set("level", levelForXp(doc.get("xp") as number));
  }
  if (delta.exchanges) {
    doc.set("exchanges", (doc.get("exchanges") as number) + delta.exchanges);
  }
  if (delta.addRating !== undefined) {
    const sum = (doc.get("ratingSum") as number) + delta.addRating;
    const count = (doc.get("ratingCount") as number) + 1;
    doc.set("ratingSum", sum);
    doc.set("ratingCount", count);
    doc.set("rating", Math.round((sum / count) * 10) / 10);
  }
  await doc.save();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toRecord(d: any): UserRecord {
  return {
    id: String(d._id),
    name: d.name,
    email: d.email,
    passwordHash: d.passwordHash,
    initials: d.initials ?? initialsOf(d.name),
    headline: d.headline ?? "",
    canTeach: d.canTeach ?? [],
    wants: d.wants ?? [],
    availability: d.availability ?? [],
    goals: d.goals ?? [],
    rating: d.rating ?? 0,
    exchanges: d.exchanges ?? 0,
    level: d.level ?? 1,
    xp: d.xp ?? 0,
    streak: d.streak ?? 0,
    badges: d.badges ?? 0,
    onboarded: !!d.onboarded,
    createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
  };
}

const validId = (id: string) => mongoose.isValidObjectId(id);

export const mongoUserRepo: UserRepo = {
  async health() {
    await connect();
    await mongoose.connection.db!.command({ ping: 1 });
  },
  async findByEmail(email) {
    await connect();
    const d = await UserModel.findOne({ email }).lean();
    return d ? toRecord(d) : null;
  },
  async findById(id) {
    await connect();
    if (!validId(id)) return null;
    const d = await UserModel.findById(id).lean();
    return d ? toRecord(d) : null;
  },
  async create({ name, email, passwordHash }) {
    await connect();
    try {
      const d = await UserModel.create({ name, email, passwordHash, initials: initialsOf(name) });
      return toRecord(d.toObject());
    } catch (e) {
      if ((e as { code?: number }).code === 11000) throw new Error("EMAIL_TAKEN");
      throw e;
    }
  },
  async updateProfile(id, profile) {
    await connect();
    if (!validId(id)) return null;
    const d = await UserModel.findByIdAndUpdate(id, { ...profile, onboarded: true }, { new: true }).lean();
    return d ? toRecord(d) : null;
  },
  async listOnboarded(excludeId, limit) {
    await connect();
    const filter: Record<string, unknown> = { onboarded: true };
    if (validId(excludeId)) filter._id = { $ne: excludeId };
    const docs = await UserModel.find(filter).limit(limit).lean();
    return docs.map(toRecord);
  },
};
