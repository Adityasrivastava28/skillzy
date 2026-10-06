"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/themes/prism-tomorrow.css";
import { Code2, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { inputCls } from "@/components/forms/Field";
import { api } from "@/lib/api";
import { CODE_LANGUAGES, type CodeLanguage, type CodePadRecord } from "@/lib/types";

const GRAMMAR: Record<CodeLanguage, { lang: string; label: string }> = {
  javascript: { lang: "javascript", label: "JavaScript" },
  typescript: { lang: "typescript", label: "TypeScript" },
  python: { lang: "python", label: "Python" },
  java: { lang: "java", label: "Java" },
  cpp: { lang: "cpp", label: "C++" },
  html: { lang: "markup", label: "HTML" },
  css: { lang: "css", label: "CSS" },
  plaintext: { lang: "none", label: "Plain text" },
};

function highlight(code: string, language: CodeLanguage) {
  const g = GRAMMAR[language];
  const grammar = Prism.languages[g.lang];
  if (!grammar) return code;
  return Prism.highlight(code, grammar, g.lang);
}

/**
 * A code pad shared by both participants of a swap. Saved to the exchange,
 * polled so the other person's edits show up, with last-write-wins — simple,
 * and good enough for two people taking turns rather than typing at once.
 */
export function CodeEditor({ exchangeId, initialPad }: { exchangeId: string; initialPad: CodePadRecord }) {
  const [language, setLanguage] = useState<CodeLanguage>(initialPad.language);
  const [content, setContent] = useState(initialPad.content);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const lastKnownUpdatedAt = useRef(initialPad.updatedAt);
  const lastEditAt = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Poll for the other person's edits, but never clobber what the viewer is actively typing.
  useEffect(() => {
    const iv = setInterval(async () => {
      const res = await api<{ pad: CodePadRecord }>(`/api/exchanges/${exchangeId}/code`, "GET");
      if (!res.ok) return;
      const { pad } = res.data;
      const typingRecently = Date.now() - lastEditAt.current < 2000;
      if (pad.updatedAt !== lastKnownUpdatedAt.current && !typingRecently) {
        lastKnownUpdatedAt.current = pad.updatedAt;
        setLanguage(pad.language);
        setContent(pad.content);
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [exchangeId]);

  function save(patch: { language?: CodeLanguage; content?: string }) {
    clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      const res = await api<{ pad: CodePadRecord }>(`/api/exchanges/${exchangeId}/code`, "PUT", patch);
      if (!res.ok) {
        setError(res.error);
        setSaveState("idle");
        return;
      }
      lastKnownUpdatedAt.current = res.data.pad.updatedAt;
      setSaveState("saved");
    }, 700);
  }

  function onChange(value: string) {
    lastEditAt.current = Date.now();
    setContent(value);
    setError(null);
    save({ content: value });
  }

  function onLanguageChange(value: CodeLanguage) {
    lastEditAt.current = Date.now();
    setLanguage(value);
    save({ language: value });
  }

  return (
    <Card className="flex h-[520px] flex-col p-0">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Code2 size={16} aria-hidden /> Shared code pad
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted">
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && <><Check size={13} className="text-emerald-600" aria-hidden /> Saved</>}
          </span>
          <select
            className={`${inputCls} w-auto py-1.5 text-sm`}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as CodeLanguage)}
          >
            {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{GRAMMAR[l].label}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="px-4 pt-2 text-xs text-rose-700">{error}</p>}

      <div className="min-h-0 flex-1 overflow-auto bg-[#2d2d2d]">
        <Editor
          value={content}
          onValueChange={onChange}
          highlight={(code) => highlight(code, language)}
          padding={16}
          textareaClassName="focus:outline-none"
          style={{
            fontFamily: '"Fira Code", ui-monospace, Menlo, Consolas, monospace',
            fontSize: 13,
            minHeight: "100%",
          }}
          placeholder="// Write or paste code here — it's shared live with the other person"
        />
      </div>
    </Card>
  );
}
