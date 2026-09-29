import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { getSessionUserId } from "@/lib/auth/session";

export const metadata = { title: "Log in — SkillSwap" };

export default async function LoginPage() {
  if (await getSessionUserId()) redirect("/dashboard");
  return <AuthForm mode="login" />;
}
