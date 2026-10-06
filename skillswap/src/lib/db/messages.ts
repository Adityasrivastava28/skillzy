import mongoose, { Schema } from "mongoose";
import { connect } from "./mongo";
import type { ConversationRecord, DirectMessageRecord } from "@/lib/types";

const conversationSchema = new Schema(
  {
    // Always stored with userAId < userBId so a pair maps to exactly one conversation.
    userAId: { type: String, required: true, index: true },
    userBId: { type: String, required: true, index: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
conversationSchema.index({ userAId: 1, userBId: 1 }, { unique: true });

const directMessageSchema = new Schema(
  {
    conversationId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

const ConversationModel = mongoose.models.Conversation ?? mongoose.model("Conversation", conversationSchema);
const DirectMessageModel = mongoose.models.DirectMessage ?? mongoose.model("DirectMessage", directMessageSchema);

/* eslint-disable @typescript-eslint/no-explicit-any */
function toConversation(d: any): ConversationRecord {
  return {
    id: String(d._id),
    userAId: d.userAId,
    userBId: d.userBId,
    createdAt: new Date(d.createdAt).toISOString(),
    lastMessageAt: new Date(d.lastMessageAt ?? d.createdAt).toISOString(),
  };
}

function toMessage(d: any): DirectMessageRecord {
  return {
    id: String(d._id),
    conversationId: d.conversationId,
    fromUserId: d.fromUserId,
    text: d.text,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

const validId = (id: string) => mongoose.isValidObjectId(id);
const pairKey = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

/** One conversation per unordered pair of users. Created the moment two people become friends. */
export async function getOrCreateConversation(userA: string, userB: string): Promise<ConversationRecord> {
  await connect();
  const [userAId, userBId] = pairKey(userA, userB);
  const existing = await ConversationModel.findOne({ userAId, userBId }).lean();
  if (existing) return toConversation(existing);
  try {
    const d = await ConversationModel.create({ userAId, userBId });
    return toConversation(d.toObject());
  } catch (e) {
    // Race: someone else created it between our find and create.
    if ((e as { code?: number }).code === 11000) {
      const d = await ConversationModel.findOne({ userAId, userBId }).lean();
      if (d) return toConversation(d);
    }
    throw e;
  }
}

export async function getConversationById(id: string): Promise<ConversationRecord | null> {
  await connect();
  if (!validId(id)) return null;
  const d = await ConversationModel.findById(id).lean();
  return d ? toConversation(d) : null;
}

export async function findConversationBetween(userA: string, userB: string): Promise<ConversationRecord | null> {
  await connect();
  const [userAId, userBId] = pairKey(userA, userB);
  const d = await ConversationModel.findOne({ userAId, userBId }).lean();
  return d ? toConversation(d) : null;
}

export async function listConversationsForUser(userId: string): Promise<ConversationRecord[]> {
  await connect();
  const docs = await ConversationModel.find({ $or: [{ userAId: userId }, { userBId: userId }] })
    .sort({ lastMessageAt: -1 })
    .lean();
  return docs.map(toConversation);
}

export async function sendDirectMessage(
  conversationId: string,
  fromUserId: string,
  text: string,
): Promise<DirectMessageRecord> {
  await connect();
  const d = await DirectMessageModel.create({ conversationId, fromUserId, text });
  await ConversationModel.findByIdAndUpdate(conversationId, { lastMessageAt: new Date() });
  return toMessage(d.toObject());
}

export async function listDirectMessages(conversationId: string): Promise<DirectMessageRecord[]> {
  await connect();
  const docs = await DirectMessageModel.find({ conversationId }).sort({ createdAt: 1 }).lean();
  return docs.map(toMessage);
}

export async function lastMessageFor(conversationId: string): Promise<DirectMessageRecord | null> {
  await connect();
  const d = await DirectMessageModel.findOne({ conversationId }).sort({ createdAt: -1 }).lean();
  return d ? toMessage(d) : null;
}
