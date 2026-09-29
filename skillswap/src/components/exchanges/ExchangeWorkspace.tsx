"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Calendar, Check, X, Ban, Star, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SkillChip } from "@/components/ui/SkillChip";
import { Modal } from "@/components/ui/Modal";
import { ErrorNote } from "@/components/forms/ErrorNote";
import { inputCls } from "@/components/forms/Field";
import { api } from "@/lib/api";
import type { ExchangeWithPeer, MessageRecord, User } from "@/lib/types";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  completed: "bg-blue-50 text-blue-700",
  declined: "bg-slate-100 text-muted",
  cancelled: "bg-slate-100 text-muted",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", accepted: "Active", completed: "Completed", declined: "Declined", cancelled: "Cancelled",
};

function Chat({ exchangeId, me, initialMessages, canSend }: { exchangeId: string; me: User; initialMessages: MessageRecord[]; canSend: boolean }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(messages.length);

  useEffect(() => {
    const iv = setInterval(async () => {
      const res = await api<{ messages: MessageRecord[] }>(`/api/exchanges/${exchangeId}/messages`, "GET");
      if (res.ok) setMessages(res.data.messages);
    }, 4000);
    return () => clearInterval(iv);
  }, [exchangeId]);

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
    const res = await api<{ message: MessageRecord }>(`/api/exchanges/${exchangeId}/messages`, "POST", { text: value });
    setSending(false);
    if (!res.ok) return setError(res.error);
    setMessages((m) => [...m, res.data.message]);
    setText("");
  }

  return (
    <Card className="flex h-[420px] flex-col p-0">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">No messages yet. Say hello.</p>
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
      {canSend ? (
        <div className="border-t border-line p-3">
          {error && <p className="mb-2 text-xs text-red-700">{error}</p>}
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="Type a message…"
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
      ) : (
        <div className="border-t border-line p-3 text-center text-xs text-muted">This exchange is closed to new messages.</div>
      )}
    </Card>
  );
}

function ScheduleForm({ exchangeId, onDone }: { exchangeId: string; onDone: () => void }) {
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!when) return setError("Pick a date and time");
    setBusy(true);
    setError(null);
    const res = await api(`/api/exchanges/${exchangeId}/sessions`, "POST", {
      scheduledAt: new Date(when).toISOString(),
      durationMinutes: duration,
      note,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDone();
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="when" className="mb-1.5 block text-sm font-medium">Date & time</label>
        <input id="when" type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} />
      </div>
      <div>
        <label htmlFor="duration" className="mb-1.5 block text-sm font-medium">Duration</label>
        <select id="duration" className={inputCls} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutes</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="sessionNote" className="mb-1.5 block text-sm font-medium">Note (optional)</label>
        <input id="sessionNote" className={inputCls} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What will you cover?" />
      </div>
      <ErrorNote message={error} />
      <Button className="w-full" onClick={submit} disabled={busy}>{busy ? "Scheduling…" : "Propose session"}</Button>
    </div>
  );
}

function RateForm({ exchangeId, peerName, onDone }: { exchangeId: string; peerName: string; onDone: () => void }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await api(`/api/exchanges/${exchangeId}/complete`, "POST", { stars, comment });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDone();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-medium">How was swapping with {peerName}?</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n} stars`}>
              <Star size={28} className={n <= stars ? "fill-accent text-accent" : "text-slate-200"} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="comment" className="mb-1.5 block text-sm font-medium">Comment (optional)</label>
        <textarea id="comment" rows={3} maxLength={500} className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <ErrorNote message={error} />
      <Button className="w-full" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit & close swap"}</Button>
    </div>
  );
}

const SESSION_XP_LABEL = "+15 XP each";

export function ExchangeWorkspace({
  exchange, me, initialMessages,
}: { exchange: ExchangeWithPeer; me: User; initialMessages: MessageRecord[] }) {
  const router = useRouter();
  const [scheduling, setScheduling] = useState(false);
  const [rating, setRating] = useState(false);
  const [busySession, setBusySession] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const iTeach = exchange.viewerRole === "from" ? exchange.offerSkill : exchange.wantSkill;
  const iLearn = exchange.viewerRole === "from" ? exchange.wantSkill : exchange.offerSkill;
  const isActive = exchange.status === "accepted";
  const hasCompletedSession = exchange.sessions.some((s) => s.status === "completed");
  const myRating = exchange.ratings.find((r) => r.by === me.id);
  const sortedSessions = [...exchange.sessions].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  async function sessionAction(sessionId: string, path: "respond" | "complete", body?: object) {
    setBusySession(sessionId);
    setSessionError(null);
    const res = await api(`/api/exchanges/${exchange.id}/sessions/${sessionId}/${path}`, "POST", body ?? {});
    setBusySession(null);
    if (!res.ok) return setSessionError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar initials={exchange.peer.initials} size="lg" />
          <div>
            <h1 className="text-xl font-semibold">{exchange.peer.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <span>You teach</span><SkillChip label={iTeach} tone="teach" />
              <span>· you learn</span><SkillChip label={iLearn} tone="learn" />
            </div>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[exchange.status]}`}>
          {STATUS_LABEL[exchange.status]}
        </span>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Chat</h2>
          <Chat exchangeId={exchange.id} me={me} initialMessages={initialMessages} canSend={exchange.status !== "declined" && exchange.status !== "cancelled"} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Sessions</h2>
            {isActive && <Button variant="outline" onClick={() => setScheduling(true)}><Calendar size={15} aria-hidden /> Schedule</Button>}
          </div>

          {sessionError && <p className="mb-2 text-sm text-red-700">{sessionError}</p>}

          {sortedSessions.length === 0 ? (
            <Card className="text-center text-sm text-muted">No sessions scheduled yet.</Card>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((s) => {
                const proposedByMe = s.proposedBy === me.id;
                const iCompleted = s.completedBy.includes(me.id);
                return (
                  <Card key={s.id} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 font-semibold"><Clock size={14} aria-hidden /> {fmt(s.scheduledAt)}</p>
                        <p className="mt-0.5 text-xs text-muted">{s.durationMinutes} min{s.note ? ` · ${s.note}` : ""}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-muted">{s.status}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.status === "proposed" && !proposedByMe && (
                        <>
                          <Button variant="outline" onClick={() => sessionAction(s.id, "respond", { action: "decline" })} disabled={busySession === s.id}>
                            <X size={14} aria-hidden /> Decline
                          </Button>
                          <Button onClick={() => sessionAction(s.id, "respond", { action: "confirm" })} disabled={busySession === s.id}>
                            <Check size={14} aria-hidden /> Confirm
                          </Button>
                        </>
                      )}
                      {s.status === "proposed" && proposedByMe && (
                        <>
                          <span className="text-xs text-muted">Waiting for {exchange.peer.name.split(" ")[0]} to confirm</span>
                          <Button variant="ghost" onClick={() => sessionAction(s.id, "respond", { action: "cancel" })} disabled={busySession === s.id}>
                            <Ban size={14} aria-hidden /> Cancel
                          </Button>
                        </>
                      )}
                      {s.status === "confirmed" && (
                        <>
                          <Button
                            variant={iCompleted ? "ghost" : "primary"}
                            onClick={() => sessionAction(s.id, "complete")}
                            disabled={busySession === s.id || iCompleted}
                            title={iCompleted ? "Waiting for the other person to also mark it done" : undefined}
                          >
                            <Check size={14} aria-hidden /> {iCompleted ? "Waiting for them to confirm" : "Mark as done"}
                          </Button>
                          <Button variant="ghost" onClick={() => sessionAction(s.id, "respond", { action: "cancel" })} disabled={busySession === s.id}>
                            <Ban size={14} aria-hidden /> Cancel
                          </Button>
                        </>
                      )}
                      {s.status === "completed" && <span className="text-xs font-medium text-emerald-700">Both confirmed — {SESSION_XP_LABEL}</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Wrap up this swap</h2>
              <p className="text-sm text-muted">
                {hasCompletedSession
                  ? myRating
                    ? "You've rated this swap. Waiting for the other person to close it too."
                    : "Rate the swap to close it out."
                  : "Complete at least one session together before closing this swap."}
              </p>
            </div>
            <Button onClick={() => setRating(true)} disabled={!hasCompletedSession || !!myRating}>
              Rate & complete
            </Button>
          </div>
        </Card>
      )}

      {exchange.status === "completed" && exchange.ratings.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Ratings</h2>
          <div className="space-y-3">
            {exchange.ratings.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className="flex text-accent">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className={j < r.stars ? "fill-accent" : "text-slate-200"} />
                  ))}
                </div>
                <p className="text-muted">{r.by === me.id ? "You" : exchange.peer.name.split(" ")[0]}: {r.comment || "(no comment)"}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {scheduling && (
        <Modal title="Schedule a session" onClose={() => setScheduling(false)}>
          <ScheduleForm exchangeId={exchange.id} onDone={() => { setScheduling(false); router.refresh(); }} />
        </Modal>
      )}
      {rating && (
        <Modal title="Close this swap" onClose={() => setRating(false)}>
          <RateForm exchangeId={exchange.id} peerName={exchange.peer.name.split(" ")[0]} onDone={() => { setRating(false); router.refresh(); }} />
        </Modal>
      )}
    </div>
  );
}
