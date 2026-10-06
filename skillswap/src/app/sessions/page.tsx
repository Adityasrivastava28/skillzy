import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listScheduledSessions } from "@/lib/sessions-view";
import { SessionsBoard } from "@/components/sessions/SessionsBoard";

export const metadata = { title: "Schedule — SkillSwap" };
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const sessions = await listScheduledSessions(me.id);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Schedule</h1>
        <p className="mt-1 text-muted">Every session across your swaps, in one place. Confirm, complete, or cancel right from here.</p>
      </header>
      <SessionsBoard sessions={sessions} me={me.id} />
    </div>
  );
}
