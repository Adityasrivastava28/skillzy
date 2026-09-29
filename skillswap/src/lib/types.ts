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
  level: number;
  xp: number;
  streak: number;
  badges: number;
}

/** Full stored record. Never send to a client as-is. */
export interface UserRecord extends User {
  email: string;
  passwordHash: string;
  onboarded: boolean;
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
