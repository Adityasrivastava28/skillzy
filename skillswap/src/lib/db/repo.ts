import type { ProfileInput, User, UserRecord } from "@/lib/types";

/**
 * Storage contract. Route handlers and pages only talk to this interface,
 * so the database can change (e.g. MongoDB -> Postgres) without
 * touching product code.
 */
export interface UserRepo {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  /** Throws Error("EMAIL_TAKEN") if the email already exists. */
  create(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord>;
  updateProfile(id: string, profile: ProfileInput): Promise<UserRecord | null>;
  listOnboarded(excludeId: string, limit: number): Promise<UserRecord[]>;
  /** Resolves if the database is reachable, rejects otherwise. */
  health(): Promise<void>;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Strip secrets before anything leaves the server. */
export function toPublic(r: UserRecord): User {
  return {
    id: r.id,
    name: r.name,
    initials: r.initials,
    headline: r.headline,
    canTeach: r.canTeach,
    wants: r.wants,
    availability: r.availability,
    goals: r.goals,
    rating: r.rating,
    exchanges: r.exchanges,
    level: r.level,
    xp: r.xp,
    streak: r.streak,
    badges: r.badges,
  };
}
