export type Slot = string; // e.g. "Tue-eve", "Sat-morn"

/** Public-facing profile. Safe to send to any client. */
export interface User {
  id: string;
  name: string;
  initials: string;
  headline: string;
  canTeach: string[];
  wants: string[];
  availability: Slot[];
  goals: string[];
  rating: number;
  exchanges: number;
  sessionsCompleted: number;
  level: number;
  xp: number;
  streak: number;
  /** Earned-badge count, computed from real stats — see lib/gamification.ts. */
  badges: number;
}

/** Full stored record. Never send to a client as-is. */
export interface UserRecord extends User {
  email: string;
  passwordHash: string;
  onboarded: boolean;
  /** YYYY-MM-DD the streak was last bumped, or null. Internal bookkeeping only. */
  lastActiveDate: string | null;
  createdAt: string;
}

export interface ProfileInput {
  headline: string;
  canTeach: string[];
  wants: string[];
  availability: Slot[];
  goals: string[];
}

export interface MatchBreakdown {
  skillFit: number;
  availability: number;
  goals: number;
  overall: number;
}

/* ---------------------------- Exchanges ---------------------------- */

export type ExchangeStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";
export type SessionStatus = "proposed" | "confirmed" | "declined" | "completed" | "cancelled";

export interface ExchangeSession {
  id: string;
  proposedBy: string;
  scheduledAt: string; // ISO datetime
  durationMinutes: number;
  note: string;
  status: SessionStatus;
  /** userIds who have marked this session as done. Completed once both have. */
  completedBy: string[];
  createdAt: string;
}

export interface ExchangeRating {
  by: string;
  to: string;
  stars: number; // 1-5
  comment: string;
}

/** A swap between two people: fromUser proposed it. */
export interface ExchangeRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  offerSkill: string; // what fromUser will teach
  wantSkill: string; // what fromUser wants to learn from toUser
  note: string;
  status: ExchangeStatus;
  sessions: ExchangeSession[];
  ratings: ExchangeRating[];
  createdAt: string;
  updatedAt: string;
}

/** Exchange with the other participant's public info attached, for the UI. */
export interface ExchangeWithPeer extends ExchangeRecord {
  peer: User;
  /** "them" if the current viewer is fromUser, "me"-perspective helper for the UI. */
  viewerRole: "from" | "to";
}

export interface MessageRecord {
  id: string;
  exchangeId: string;
  fromUserId: string;
  text: string;
  createdAt: string;
}

/* ----------------------------- Friends ------------------------------ */

export type FriendStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface FriendRequestRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendStatus;
  createdAt: string;
  updatedAt: string;
}

/** Friend request with the other participant's public profile attached, for the UI. */
export interface FriendRequestWithPeer extends FriendRequestRecord {
  peer: User;
  viewerRole: "from" | "to";
}

/* --------------------------- Direct messages -------------------------- */

export interface ConversationRecord {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface DirectMessageRecord {
  id: string;
  conversationId: string;
  fromUserId: string;
  text: string;
  createdAt: string;
}

/** Conversation with the other participant's public profile and a preview, for the UI. */
export interface ConversationWithPeer extends ConversationRecord {
  peer: User;
  lastMessage: DirectMessageRecord | null;
}

/* ------------------------------ Scheduling ----------------------------- */

/** A session flattened out of its parent exchange, with the peer attached, for a unified schedule view. */
export interface ScheduledSession extends ExchangeSession {
  exchangeId: string;
  peer: User;
  iTeach: string;
  iLearn: string;
}

/* ------------------------------ Video calls ----------------------------- */

export type CallSignalType = "offer" | "answer" | "ice-candidate" | "hangup";

/** One step of WebRTC signaling (SDP offer/answer or an ICE candidate), relayed through our own backend. */
export interface CallSignalRecord {
  id: string;
  exchangeId: string;
  fromUserId: string;
  type: CallSignalType;
  payload: string;
  createdAt: string;
}

/* ------------------------------ Code pad -------------------------------- */

export const CODE_LANGUAGES = ["javascript", "typescript", "python", "java", "cpp", "html", "css", "plaintext"] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/** One shared, persisted code pad per exchange. Last write wins. */
export interface CodePadRecord {
  exchangeId: string;
  language: CodeLanguage;
  content: string;
  updatedBy: string | null;
  updatedAt: string;
}
