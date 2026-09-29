"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "./Field";
import { ErrorNote } from "./ErrorNote";
import { TagInput } from "./TagInput";
import { DAYS, GOALS, PARTS, SUGGESTED_SKILLS } from "@/lib/constants";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ProfileInput } from "@/lib/types";

const STEPS = ["About you", "Your skills", "Availability"];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function OnboardingForm({ initial }: { initial: ProfileInput }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProfileInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProfileInput>(k: K, v: ProfileInput[K]) => setData((d) => ({ ...d, [k]: v }));

  function validate(s: number): string | null {
    if (s === 0) {
      if (data.headline.trim().length < 2) return "Tell us what you do, e.g. “Final-year CS student”";
      if (data.goals.length === 0) return "Pick at least one goal";
    }
    if (s === 1) {
      if (data.canTeach.length === 0) return "Add at least one skill you can teach";
      if (data.wants.length === 0) return "Add at least one skill you want to learn";
    }
    if (s === 2 && data.availability.length === 0) return "Pick at least one time slot";
    return null;
  }

  async function next() {
    const err = validate(step);
    setError(err);
    if (err) return;
    if (step < STEPS.length - 1) return setStep(step + 1);

    setSaving(true);
    const res = await api("/api/profile", "PUT", data);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i <= step ? "bg-primary text-white" : "bg-slate-200 text-muted",
              )}
            >
              {i + 1}
            </span>
            <span className={cn("hidden text-sm sm:block", i === step ? "font-semibold" : "text-muted")}>{s}</span>
            {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-line")} />}
          </li>
        ))}
      </ol>

      <Card className="space-y-6 p-6 md:p-8">
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Tell us about you</h1>
              <p className="mt-1 text-sm text-muted">This helps us find people worth swapping with.</p>
            </div>
            <Field
              label="What do you do?"
              id="headline"
              placeholder="Final-year CS student"
              maxLength={80}
              value={data.headline}
              onChange={(e) => set("headline", e.target.value)}
            />
            <fieldset>
              <legend className="mb-2 text-sm font-medium">What are you hoping to get out of it?</legend>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => {
                  const on = data.goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("goals", toggle(data.goals, g.id))}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition",
                        on ? "border-primary bg-blue-50 font-medium text-primary" : "border-line bg-white text-muted hover:border-primary",
                      )}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Your skills</h1>
              <p className="mt-1 text-sm text-muted">Type a skill and press Enter, or tap a suggestion.</p>
            </div>
            <TagInput
              label="I can teach"
              tone="teach"
              value={data.canTeach}
              onChange={(v) => set("canTeach", v)}
              suggestions={SUGGESTED_SKILLS}
              placeholder="e.g. Python"
            />
            <TagInput
              label="I want to learn"
              tone="learn"
              value={data.wants}
              onChange={(v) => set("wants", v)}
              suggestions={SUGGESTED_SKILLS}
              placeholder="e.g. UI/UX Design"
            />
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">When are you free?</h1>
              <p className="mt-1 text-sm text-muted">Pick the slots that usually work. We match on overlap.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th />
                    {PARTS.map((p) => <th key={p.id} className="pb-1 text-xs font-medium text-muted">{p.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d) => (
                    <tr key={d}>
                      <th scope="row" className="pr-2 text-left text-xs font-medium text-muted">{d}</th>
                      {PARTS.map((p) => {
                        const slot = `${d}-${p.id}`;
                        const on = data.availability.includes(slot);
                        return (
                          <td key={slot}>
                            <button
                              type="button"
                              aria-pressed={on}
                              aria-label={`${d} ${p.label}`}
                              onClick={() => set("availability", toggle(data.availability, slot))}
                              className={cn(
                                "h-9 w-full rounded-lg border transition",
                                on ? "border-primary bg-primary" : "border-line bg-white hover:border-primary",
                              )}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <ErrorNote message={error} />

        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => { setError(null); setStep(step - 1); }}>
              <ArrowLeft size={16} aria-hidden /> Back
            </Button>
          ) : <span />}
          <Button onClick={next}>
            {saving ? "Saving…" : step === STEPS.length - 1 ? "Finish" : "Continue"}
            {step < STEPS.length - 1 && <ArrowRight size={16} aria-hidden />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
