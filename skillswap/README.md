# SkillSwap

Learn by Teaching. Teach by Learning.

## Setup

1. Install dependencies

       npm install

2. Create `.env.local` in this folder (copy `.env.example`) with:

       MONGODB_URI=<your MongoDB connection string>
       AUTH_SECRET=<any long random string>

   Get a free MongoDB in ~3 minutes with MongoDB Atlas: create a free (M0) cluster,
   add a database user, allow your IP under Network Access, then copy the
   "Drivers" connection string and add a database name, e.g. `.../skillswap?...`.
   A local MongoDB (`mongodb://127.0.0.1:27017/skillswap`) works too.

3. Run

       npm run dev      # http://localhost:3000

4. Confirm the database connection by opening http://localhost:3000/api/health
   (it should show `{"ok":true,"database":"up"}`).

## What's real

Everything is backed by MongoDB. Nothing is mocked or seeded.

- **Accounts**: signup/login, bcrypt password hashing, signed httpOnly session cookies, rate limiting.
- **Profiles & matching**: skill fit (50%) + availability overlap (30%) + shared goals (20%), with the breakdown shown in the UI.
- **Explore**: search everyone who's finished onboarding.
- **Swap requests**: send a request naming a real skill you teach and a real skill they teach (checked server-side against their actual profile); accept, decline, or cancel.
- **Chat**: real messages stored per exchange, polled live.
- **Sessions**: propose a date/time, the other person confirms, either can cancel. A session only becomes "completed" once **both** people mark it done — that's when real XP (+15 each) is awarded.
- **Closing a swap**: you can't close (and rate) an exchange until at least one session actually completed together. Once both people rate each other, the exchange closes and both people's `rating` and `exchanges` count update for real — not fabricated numbers.
- **Friends**: send/accept/decline/cancel friend requests from Explore, your matches, or the Friends page — independent of any swap.
- **Direct messages**: once you're friends, you get a real DM thread with them (polled live), no exchange required.
- **Schedule**: every session across every one of your swaps, in one place — grouped by day, with confirm/cancel/mark-done actions, so you don't have to dig through each exchange separately.

## Structure

- `src/lib/db/` - storage layer: `repo.ts` (user interface), `mongo.ts` (MongoDB + user stats), `exchanges.ts` (swap requests, sessions, messages), `friends.ts` (friend requests), `messages.ts` (DM conversations), `index.ts`
- `src/lib/exchange-view.ts`, `friend-view.ts`, `conversation-view.ts` - attach the other participant's public profile to each record for the UI
- `src/lib/sessions-view.ts` - flattens every session out of every exchange into one list for the schedule page
- `src/lib/auth/session.ts` - signed httpOnly cookie sessions
- `src/lib/rate-limit.ts` - MongoDB-backed rate limiting (works across server instances)
- `src/lib/validation.ts` - zod schemas shared by API routes
- `src/lib/match.ts` - match scoring (skill fit 50%, availability 30%, goals 20%)
- `src/app/api/` - `auth/{signup,login,logout,me}`, `profile`, `exchanges/**` (requests, messages, sessions, completion), `friends/**`, `conversations/**`, `sessions`
- `src/app/{explore,exchanges,exchanges/[id],friends,messages,messages/[id],sessions}` - browse people, manage requests, the chat/session workspace, friends, DMs, unified schedule
- `src/components/ui/` design system, `src/components/forms/` auth + onboarding, `src/components/exchanges/` swap flow, `src/components/friends/` friend requests, `src/components/messages/` DMs, `src/components/sessions/` schedule board

## Not built yet

- Email verification, password reset, Google login.
- Public profile pages (currently profiles are only visible via Explore cards and inside a shared exchange).
- Badges and streaks stay at 0 — no fabricated numbers; real logic for them hasn't been built yet.
- Unfriending (requests can be accepted/declined/cancelled, but there's no way to end an existing friendship yet).
- Read receipts / unread counts for DMs (not built — avoided faking them).

## Before deploying

- Set `AUTH_SECRET` and `MONGODB_URI` in your host's environment (Vercel project settings).
