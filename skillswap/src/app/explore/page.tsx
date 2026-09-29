import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserRepo } from "@/lib/db";
import { toPublic } from "@/lib/db/repo";
import { ExploreList } from "@/components/exchanges/ExploreList";

export const metadata = { title: "Explore — SkillSwap" };
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const others = (await (await getUserRepo()).listOnboarded(me.id, 100)).map(toPublic);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Explore</h1>
        <p className="mt-1 text-muted">Find someone who teaches what you want to learn.</p>
      </header>
      <ExploreList me={toPublic(me)} people={others} />
    </div>
  );
}
