import mongoose, { Schema } from "mongoose";
import { connect } from "./mongo";
import type { CallSignalRecord, CallSignalType } from "@/lib/types";

const callSignalSchema = new Schema(
  {
    exchangeId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true },
    type: { type: String, required: true },
    payload: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const CallSignalModel = mongoose.models.CallSignal ?? mongoose.model("CallSignal", callSignalSchema);

/* eslint-disable @typescript-eslint/no-explicit-any */
function toSignal(d: any): CallSignalRecord {
  return {
    id: String(d._id),
    exchangeId: d.exchangeId,
    fromUserId: d.fromUserId,
    type: d.type,
    payload: d.payload,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

export async function sendCallSignal(
  exchangeId: string,
  fromUserId: string,
  type: CallSignalType,
  payload: string,
): Promise<CallSignalRecord> {
  await connect();
  const d = await CallSignalModel.create({ exchangeId, fromUserId, type, payload });
  return toSignal(d.toObject());
}

/**
 * Everything after `after` (a signal id), oldest first — the polling client's
 * "what's new since I last checked" cursor. Omit `after` for the full backlog
 * (used when a tab first opens, in case a call is already in progress).
 *
 * `excludeUserId` leaves out the caller's own signals: a poller must only ever
 * see what the *other* participant sent, otherwise a caller "receives" its
 * own offer back, misreads it as glare, and tears down its own connection
 * before the real peer ever sees it.
 */
export async function listCallSignals(exchangeId: string, after?: string, excludeUserId?: string): Promise<CallSignalRecord[]> {
  await connect();
  const filter: Record<string, unknown> = { exchangeId };
  if (after && mongoose.isValidObjectId(after)) {
    filter._id = { $gt: new mongoose.Types.ObjectId(after) };
  }
  if (excludeUserId) {
    filter.fromUserId = { $ne: excludeUserId };
  }
  const docs = await CallSignalModel.find(filter).sort({ _id: 1 }).limit(200).lean();
  return docs.map(toSignal);
}

/** Wipes the signaling history for an exchange so the next call starts clean. */
export async function clearCallSignals(exchangeId: string): Promise<void> {
  await connect();
  await CallSignalModel.deleteMany({ exchangeId });
}
