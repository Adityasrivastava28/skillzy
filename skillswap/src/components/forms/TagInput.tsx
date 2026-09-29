"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { inputCls } from "./Field";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  tone: "teach" | "learn";
  placeholder?: string;
  max?: number;
}

export function TagInput({ label, value, onChange, suggestions, tone, placeholder, max = 10 }: Props) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const has = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase());
  const add = (raw: string) => {
    const s = raw.trim();
    if (!s || has(s) || value.length >= max) return;
    onChange([...value, s]);
    setDraft("");
  };
  const remove = (s: string) => onChange(value.filter((v) => v !== s));

  const chip = tone === "teach" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700";
  const shown = suggestions.filter((s) => !has(s)).slice(0, 8);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        id={id}
        className={inputCls}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            remove(value[value.length - 1]);
          }
        }}
      />
      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((s) => (
            <li key={s} className={cn("flex items-center gap-1 rounded-full py-1 pl-3 pr-1.5 text-xs font-medium", chip)}>
              {s}
              <button type="button" onClick={() => remove(s)} aria-label={`Remove ${s}`} className="rounded-full p-0.5 hover:bg-black/10">
                <X size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {shown.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}
