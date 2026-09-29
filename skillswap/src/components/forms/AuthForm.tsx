"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "./Field";
import { ErrorNote } from "./ErrorNote";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    const res = await api<{ onboarded: boolean }>(`/api/auth/${mode}`, "POST", body);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.push(res.data.onboarded ? "/dashboard" : "/onboarding");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-muted">
          {isSignup ? "Free forever. Trade skills, not money." : "Log in to continue swapping skills."}
        </p>
      </div>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {isSignup && <Field label="Full name" id="name" autoComplete="name" placeholder="Ananya Verma" required />}
          <Field label="Email" id="email" type="email" autoComplete="email" placeholder="you@college.edu" required />
          <Field
            label="Password"
            id="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            required
          />
          <ErrorNote message={error} />
          <Button type="submit" className="w-full">
            {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to SkillSwap? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-primary hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
