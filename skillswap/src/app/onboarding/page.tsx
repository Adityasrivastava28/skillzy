import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/forms/OnboardingForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Set up your profile — SkillSwap" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <OnboardingForm
      initial={{
        headline: user.headline,
        canTeach: user.canTeach,
        wants: user.wants,
        availability: user.availability,
        goals: user.goals,
      }}
    />
  );
}
