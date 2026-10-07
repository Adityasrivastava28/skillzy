import mongoose, { Schema } from "mongoose";
import { randomUUID } from "node:crypto";
import { connect, adjustUserStats } from "./mongo";
import { EXCHANGE_COMPLETE_XP, FIRST_SWAP_BONUS_XP, SESSION_XP } from "@/lib/gamification";
import type { ExchangeRecord, ExchangeSession, MessageRecord, ExchangeRating } from "@/lib/types";

const sessionSchema = new Schema(
  {
    id: { type: String, required: true },
    proposedBy: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    note: { type: String, default: "" },
    status: { type: String, required: true, default: "proposed" },
    completedBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ratingSchema = new Schema(
  {
    by: { type: String, required: true },
    to: { type: String, required: true },
    stars: { type: Number, required: true },
    comment: { type: String, default: "" },
  },
  { _id: false },
);

const exchangeSchema = new Schema(
  {
    fromUserId: { type: String, required: true, index: true },
    toUserId: { type: String, required: true, index: true },
    offerSkill: { type: String, required: true },
    wantSkill: { type: String, required: true },
    note: { type: String, default: "" },
    status: { type: String, required: true, default: "pending", index: true },
    sessions: { type: [sessionSchema], default: [] },
    ratings: { type: [ratingSchema], default: [] },
  },
  { timestamps: true },
);

const messageSchema = new Schema(
  {
    exchangeId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

const ExchangeModel = mongoose.models.Exchange ?? mongoose.model("Exchange", exchangeSchema);
const MessageModel = mongoose.models.Message ?? mongoose.model("Message", messageSchema);

/* eslint-disable @typescript-eslint/no-explicit-any */
function toExchange(d: any): ExchangeRecord {
  return {
    id: String(d._id),
    fromUserId: d.fromUserId,
    toUserId: d.toUserId,
    offerSkill: d.offerSkill,
    wantSkill: d.wantSkill,
    note: d.note ?? "",
    status: d.status,
    sessions: (d.sessions ?? []).map((s: any) => ({
      id: s.id,
      proposedBy: s.proposedBy,
      scheduledAt: new Date(s.scheduledAt).toISOString(),
      durationMinutes: s.durationMinutes,
      note: s.note ?? "",
      status: s.status,
      completedBy: s.completedBy ?? [],
      createdAt: new Date(s.createdAt ?? d.createdAt).toISOString(),
    })),
    ratings: (d.ratings ?? []).map((r: any) => ({ by: r.by, to: r.to, stars: r.stars, comment: r.comment ?? "" })),
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  };
}

function toMessage(d: any): MessageRecord {
  return {
    id: String(d._id),
    exchangeId: d.exchangeId,
    fromUserId: d.fromUserId,
    text: d.text,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

const validId = (id: string) => mongoose.isValidObjectId(id);

export async function createExchange(input: {
  fromUserId: string;
  toUserId: string;
  offerSkill: string;
  wantSkill: string;
  note: string;
}): Promise<ExchangeRecord> {
  await connect();
  const d = await ExchangeModel.create({ ...input, status: "pending", sessions: [], ratings: [] });
  return toExchange(d.toObject());
}

/** True if the two users already have a request that hasn't been resolved yet. */
export async function hasOpenExchange(userA: string, userB: string): Promise<boolean> {
  await connect();
  const count = await ExchangeModel.countDocuments({
    status: { $in: ["pending", "accepted"] },
    $or: [
      { fromUserId: userA, toUserId: userB },
      { fromUserId: userB, toUserId: userA },
    ],
  });
  return count > 0;
}

export async function getExchangeById(id: string): Promise<ExchangeRecord | null> {
  await connect();
  if (!validId(id)) return null;
  const d = await ExchangeModel.findById(id).lean();
  return d ? toExchange(d) : null;
}

export async function listExchangesForUser(userId: string): Promise<ExchangeRecord[]> {
  await connect();
  const docs = await ExchangeModel.find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map(toExchange);
}

export async function countPendingIncoming(userId: string): Promise<number> {
  await connect();
  return ExchangeModel.countDocuments({ toUserId: userId, status: "pending" });
}

/** Accept, decline, or cancel a pending request. Only the right party may call each action. */
export async function respondToExchange(
  id: string,
  userId: string,
  action: "accept" | "decline" | "cancel",
): Promise<ExchangeRecord | null> {
  await connect();
  if (!validId(id)) return null;
  const doc = await ExchangeModel.findById(id);
  if (!doc) return null;
  if (doc.get("status") !== "pending") return null;

  if (action === "accept" || action === "decline") {
    if (doc.get("toUserId") !== userId) return null;
    doc.set("status", action === "accept" ? "accepted" : "declined");
  } else {
    if (doc.get("fromUserId") !== userId) return null;
    doc.set("status", "cancelled");
  }
  await doc.save();
  return toExchange(doc.toObject());
}

export async function proposeSession(
  exchangeId: string,
  userId: string,
  input: { scheduledAt: string; durationMinutes: number; note: string },
): Promise<ExchangeRecord | null> {
  await connect();
  if (!validId(exchangeId)) return null;
  const doc = await ExchangeModel.findById(exchangeId);
  if (!doc) return null;
  if (doc.get("status") !== "accepted") return null;
  if (![doc.get("fromUserId"), doc.get("toUserId")].includes(userId)) return null;

  const session: ExchangeSession = {
    id: randomUUID(),
    proposedBy: userId,
    scheduledAt: input.scheduledAt,
    durationMinutes: input.durationMinutes,
    note: input.note,
    status: "proposed",
    completedBy: [],
    createdAt: new Date().toISOString(),
  };
  doc.set("sessions", [...(doc.get("sessions") as ExchangeSession[]), session]);
  await doc.save();
  return toExchange(doc.toObject());
}

export async function respondToSession(
  exchangeId: string,
  sessionId: string,
  userId: string,
  action: "confirm" | "decline" | "cancel",
): Promise<ExchangeRecord | null> {
  await connect();
  if (!validId(exchangeId)) return null;
  const doc = await ExchangeModel.findById(exchangeId);
  if (!doc) return null;
  const participants = [doc.get("fromUserId"), doc.get("toUserId")];
  if (!participants.includes(userId)) return null;

  const sessions = doc.get("sessions") as ExchangeSession[];
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return null;

  if (action === "confirm") {
    if (s.status !== "proposed" || s.proposedBy === userId) return null; // only the other party confirms
    s.status = "confirmed";
  } else if (action === "decline") {
    if (s.status !== "proposed") return null;
    s.status = "declined";
  } else {
    // cancel a confirmed/proposed session, either party
    if (!["proposed", "confirmed"].includes(s.status)) return null;
    s.status = "cancelled";
  }
  doc.set("sessions", sessions);
  await doc.save();
  return toExchange(doc.toObject());
}

/**
 * Mark a session done for the caller. Once both participants have, the
 * session becomes "completed" and each earns real XP for the session that
 * actually happened.
 */
export interface StatsEvent {
  leveledUp: boolean;
  newLevel: number;
  firstSwapBonus: boolean;
  xpAwarded: number;
}

export async function completeSession(
  exchangeId: string,
  sessionId: string,
  userId: string,
): Promise<{ exchange: ExchangeRecord | null; statsEvent?: StatsEvent }> {
  await connect();
  if (!validId(exchangeId)) return { exchange: null };
  const doc = await ExchangeModel.findById(exchangeId);
  if (!doc) return { exchange: null };
  const participants = [doc.get("fromUserId"), doc.get("toUserId")] as string[];
  if (!participants.includes(userId)) return { exchange: null };

  const sessions = doc.get("sessions") as ExchangeSession[];
  const s = sessions.find((x) => x.id === sessionId);
  if (!s || s.status !== "confirmed") return { exchange: null };
  if (s.completedBy.includes(userId)) return { exchange: toExchange(doc.toObject()) };

  s.completedBy = [...s.completedBy, userId];
  const bothDone = participants.every((p) => s.completedBy.includes(p));
  if (bothDone) {
    s.status = "completed";
  }
  doc.set("sessions", sessions);
  await doc.save();

  let statsEvent: StatsEvent | undefined;
  if (bothDone) {
    const results = await Promise.all(
      participants.map((p) => adjustUserStats(p, { xp: SESSION_XP, sessionsCompleted: 1 })),
    );
    const mine = results[participants.indexOf(userId)];
    if (mine) statsEvent = { ...mine, xpAwarded: SESSION_XP };
  }
  return { exchange: toExchange(doc.toObject()), statsEvent };
}

/**
 * Close out the whole exchange with a rating for the other person. Requires
 * at least one completed session — you can't close a swap where no learning
 * happened. Completes (and credits an "exchange" + rating to both people)
 * once both sides have rated.
 */
export async function rateAndMaybeComplete(
  exchangeId: string,
  userId: string,
  rating: { stars: number; comment: string },
): Promise<{ exchange: ExchangeRecord | null; error?: string; statsEvent?: StatsEvent }> {
  await connect();
  if (!validId(exchangeId)) return { exchange: null, error: "NOT_FOUND" };
  const doc = await ExchangeModel.findById(exchangeId);
  if (!doc) return { exchange: null, error: "NOT_FOUND" };
  const fromUserId = doc.get("fromUserId") as string;
  const toUserId = doc.get("toUserId") as string;
  const participants = [fromUserId, toUserId];
  if (!participants.includes(userId)) return { exchange: null, error: "NOT_FOUND" };
  if (doc.get("status") !== "accepted") return { exchange: null, error: "NOT_ACTIVE" };

  const sessions = doc.get("sessions") as ExchangeSession[];
  if (!sessions.some((s) => s.status === "completed")) {
    return { exchange: null, error: "NO_COMPLETED_SESSION" };
  }

  const ratings = doc.get("ratings") as ExchangeRating[];
  if (ratings.some((r) => r.by === userId)) {
    return { exchange: null, error: "ALREADY_RATED" };
  }

  const peer = participants.find((p) => p !== userId)!;
  const nextRatings = [...ratings, { by: userId, to: peer, stars: rating.stars, comment: rating.comment }];
  doc.set("ratings", nextRatings);

  const bothRated = participants.every((p) => nextRatings.some((r) => r.by === p));
  if (bothRated) doc.set("status", "completed");
  await doc.save();

  let statsEvent: StatsEvent | undefined;
  if (bothRated) {
    const results = await Promise.all(
      nextRatings.map((r) => adjustUserStats(r.to, { exchanges: 1, addRating: r.stars, xp: EXCHANGE_COMPLETE_XP })),
    );
    const mineIndex = nextRatings.findIndex((r) => r.to === userId);
    const mine = results[mineIndex];
    if (mine) statsEvent = { ...mine, xpAwarded: EXCHANGE_COMPLETE_XP + (mine.firstSwapBonus ? FIRST_SWAP_BONUS_XP : 0) };
  }
  return { exchange: toExchange(doc.toObject()), statsEvent };
}

export async function sendMessage(exchangeId: string, fromUserId: string, text: string): Promise<MessageRecord> {
  await connect();
  const d = await MessageModel.create({ exchangeId, fromUserId, text });
  return toMessage(d.toObject());
}

export async function listMessages(exchangeId: string): Promise<MessageRecord[]> {
  await connect();
  const docs = await MessageModel.find({ exchangeId }).sort({ createdAt: 1 }).lean();
  return docs.map(toMessage);
}
