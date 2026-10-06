import mongoose, { Schema } from "mongoose";
import { connect } from "./mongo";
import { getOrCreateConversation } from "./messages";
import type { FriendRequestRecord, FriendStatus } from "@/lib/types";

const friendRequestSchema = new Schema(
  {
    fromUserId: { type: String, required: true, index: true },
    toUserId: { type: String, required: true, index: true },
    status: { type: String, required: true, default: "pending", index: true },
  },
  { timestamps: true },
);

const FriendRequestModel =
  mongoose.models.FriendRequest ?? mongoose.model("FriendRequest", friendRequestSchema);

/* eslint-disable @typescript-eslint/no-explicit-any */
function toFriendRequest(d: any): FriendRequestRecord {
  return {
    id: String(d._id),
    fromUserId: d.fromUserId,
    toUserId: d.toUserId,
    status: d.status,
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  };
}

const validId = (id: string) => mongoose.isValidObjectId(id);

/** True if the two users already have a pending or accepted request between them (in either direction). */
export async function hasOpenFriendRequest(userA: string, userB: string): Promise<boolean> {
  await connect();
  const count = await FriendRequestModel.countDocuments({
    status: { $in: ["pending", "accepted"] },
    $or: [
      { fromUserId: userA, toUserId: userB },
      { fromUserId: userB, toUserId: userA },
    ],
  });
  return count > 0;
}

export async function areFriends(userA: string, userB: string): Promise<boolean> {
  await connect();
  const count = await FriendRequestModel.countDocuments({
    status: "accepted",
    $or: [
      { fromUserId: userA, toUserId: userB },
      { fromUserId: userB, toUserId: userA },
    ],
  });
  return count > 0;
}

export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequestRecord> {
  await connect();
  const d = await FriendRequestModel.create({ fromUserId, toUserId, status: "pending" });
  return toFriendRequest(d.toObject());
}

export async function getFriendRequestById(id: string): Promise<FriendRequestRecord | null> {
  await connect();
  if (!validId(id)) return null;
  const d = await FriendRequestModel.findById(id).lean();
  return d ? toFriendRequest(d) : null;
}

export async function listFriendRequestsForUser(userId: string): Promise<FriendRequestRecord[]> {
  await connect();
  const docs = await FriendRequestModel.find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map(toFriendRequest);
}

export async function countPendingIncomingFriendRequests(userId: string): Promise<number> {
  await connect();
  return FriendRequestModel.countDocuments({ toUserId: userId, status: "pending" });
}

/**
 * Accept, decline, or cancel a pending friend request. Only the right party may
 * call each action. Accepting also opens a conversation between the two people,
 * so messaging works the moment they become friends.
 */
export async function respondToFriendRequest(
  id: string,
  userId: string,
  action: "accept" | "decline" | "cancel",
): Promise<FriendRequestRecord | null> {
  await connect();
  if (!validId(id)) return null;
  const doc = await FriendRequestModel.findById(id);
  if (!doc) return null;
  if (doc.get("status") !== "pending") return null;

  const fromUserId = doc.get("fromUserId") as string;
  const toUserId = doc.get("toUserId") as string;

  if (action === "accept" || action === "decline") {
    if (toUserId !== userId) return null;
    doc.set("status", action === "accept" ? "accepted" : "declined");
  } else {
    if (fromUserId !== userId) return null;
    doc.set("status", "cancelled");
  }
  await doc.save();

  if (action === "accept") {
    await getOrCreateConversation(fromUserId, toUserId);
  }
  return toFriendRequest(doc.toObject());
}

export type { FriendStatus };
