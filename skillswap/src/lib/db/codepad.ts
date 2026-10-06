import mongoose, { Schema } from "mongoose";
import { connect } from "./mongo";
import type { CodeLanguage, CodePadRecord } from "@/lib/types";

const codePadSchema = new Schema(
  {
    exchangeId: { type: String, required: true, unique: true, index: true },
    language: { type: String, required: true, default: "javascript" },
    content: { type: String, default: "" },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true },
);

const CodePadModel = mongoose.models.CodePad ?? mongoose.model("CodePad", codePadSchema);

/* eslint-disable @typescript-eslint/no-explicit-any */
function toCodePad(exchangeId: string, d: any): CodePadRecord {
  if (!d) return { exchangeId, language: "javascript", content: "", updatedBy: null, updatedAt: new Date(0).toISOString() };
  return {
    exchangeId: d.exchangeId,
    language: d.language ?? "javascript",
    content: d.content ?? "",
    updatedBy: d.updatedBy ?? null,
    updatedAt: new Date(d.updatedAt ?? d.createdAt ?? Date.now()).toISOString(),
  };
}

export async function getCodePad(exchangeId: string): Promise<CodePadRecord> {
  await connect();
  const d = await CodePadModel.findOne({ exchangeId }).lean();
  return toCodePad(exchangeId, d);
}

/**
 * Last write wins — simple, and good enough for a pad two people take turns
 * typing in. The caller's own `updatedAt` echo back lets the client avoid
 * clobbering someone else's more recent edit it hasn't polled yet.
 */
export async function updateCodePad(
  exchangeId: string,
  userId: string,
  patch: { language?: CodeLanguage; content?: string },
): Promise<CodePadRecord> {
  await connect();
  const d = await CodePadModel.findOneAndUpdate(
    { exchangeId },
    { $set: { ...patch, updatedBy: userId } },
    { upsert: true, new: true },
  ).lean();
  return toCodePad(exchangeId, d);
}
