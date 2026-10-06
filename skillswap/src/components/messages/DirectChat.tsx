"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/forms/Field";
import { api } from "@/lib/api";
import type { DirectMessageRecord, User } from "@/lib/types";

export function DirectChat({
  conversationId, me, peer, initialMessages,
}: { conversationId: string; me: User; peer: User; initialMessages: DirectMessageRecord[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(messages.length);

  useEffect(() => {
    const iv = setInterval(async () => {
      const res = await api<{ messages: DirectMessageRecord[] }>(`/api/conversations/${conversationId}/messages`, "GET");
      if (res.ok) setMessages(res.data.messages);
    }, 4000);
    return () => clearInterval(iv);
  }, [conversationId]);

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      lastCount.current = messages.length;
    }
  }, [messages]);

  async function send() {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setError(null);
    const res = await api<{ message: DirectMessageRecord }>(`/api/conversations/${conversationId}/messages`, "POST", { text: value });
    setSending(false);
    if (!res.ok) return setError(res.error);
    setMessages((m) => [...m, res.data.message]);
    setText("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar initials={peer.initials} />
        <div>
          <h1 className="font-semibold">{peer.name}</h1>
          <p className="text-xs text-muted">{peer.headline}</p>
        </div>
      </div>

      <Card className="flex h-[520px] flex-col p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted">No messages yet. Say hello to {peer.name.split(" ")[0]}.</p>
          ) : (
            messages.map((m) => {
              const mine = m.fromUserId === me.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-surface text-ink"}`}>
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-line p-3">
          {error && <p className="mb-2 text-xs text-red-700">{error}</p>}
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder={`Message ${peer.name.split(" ")[0]}…`}
              value={text}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={send} disabled={sending}><Send size={16} aria-hidden /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
