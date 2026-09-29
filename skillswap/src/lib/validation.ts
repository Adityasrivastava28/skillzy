import { z } from "zod";
import { DAYS, GOALS } from "./constants";

const skill = z.string().trim().min(1).max(40);

const dedupe = (xs: string[]) => {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = x.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(60),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Enter your password").max(72),
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const exchangeRequestSchema = z.object({
  toUserId: objectId,
  offerSkill: skill,
  wantSkill: skill,
  note: z.string().trim().max(500).default(""),
});

export const exchangeRespondSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

export const messageSchema = z.object({
  text: z.string().trim().min(1, "Message can't be empty").max(2000),
});

export const sessionProposalSchema = z.object({
  scheduledAt: z.iso.datetime({ offset: true, precision: 3, error: "Invalid date/time" }),
  durationMinutes: z.number().int().min(15).max(240),
  note: z.string().trim().max(300).default(""),
});

export const sessionRespondSchema = z.object({
  action: z.enum(["confirm", "decline", "cancel"]),
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).default(""),
});

export const profileSchema = z.object({
  headline: z.string().trim().min(2, "Tell us what you do").max(80),
  canTeach: z.array(skill).min(1, "Add at least one skill you can teach").max(10).transform(dedupe),
  wants: z.array(skill).min(1, "Add at least one skill you want to learn").max(10).transform(dedupe),
  availability: z
    .array(z.string().regex(new RegExp(`^(${DAYS.join("|")})-(morn|aft|eve)$`)))
    .min(1, "Pick at least one time slot")
    .max(21),
  goals: z
    .array(z.enum(GOALS.map((g) => g.id) as [string, ...string[]]))
    .min(1, "Pick at least one goal")
    .max(GOALS.length),
});
