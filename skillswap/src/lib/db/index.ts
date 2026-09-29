import type { UserRepo } from "./repo";

/** Thrown when MONGODB_URI is missing. The message is safe to show to the user. */
export class DbNotConfiguredError extends Error {
  constructor() {
    super("The database is not configured yet. Set MONGODB_URI in .env.local (see the README).");
    this.name = "DbNotConfiguredError";
  }
}

let cached: UserRepo | undefined;

/** The one place that decides which database the app uses. */
export async function getUserRepo(): Promise<UserRepo> {
  if (cached) return cached;
  if (!process.env.MONGODB_URI) throw new DbNotConfiguredError();
  cached = (await import("./mongo")).mongoUserRepo;
  return cached;
}
