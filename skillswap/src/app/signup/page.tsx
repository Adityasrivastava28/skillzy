import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { getSessionUserId } from "@/lib/auth/session";

export const metadata = { title: "Sign up — SkillSwap" };

export default async function SignupPage() {
  if (await getSessionUserId()) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}
