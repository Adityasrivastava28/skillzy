"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Calendar, Check, X, Ban, Star, MessageCircle, CalendarDays, Video as VideoIcon, Code2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SkillChip } from "@/components/ui/SkillChip";
import { Modal } from "@/components/ui/Modal";
import { ErrorNote } from "@/components/forms/ErrorNote";
import { inputCls } from "@/components/forms/Field";
import { SessionStatusBadge, accentBorder } from "@/components/sessions/SessionStatusBadge";
import { SessionTimeTile } from "@/components/sessions/SessionTimeTile";
import { VideoCall } from "./VideoCall";
import { CodeEditor } from "./CodeEditor";
import { CelebrationModal, type Celebration } from "@/components/gamification/CelebrationModal";
import { api } from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import type { CodePadRecord, ExchangeWithPeer, MessageRecord, User } from "@/lib/types";

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
    }, 2500);
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
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-surface text-ink"}`}>
                  {m.text}
                </div>
                <span className="mt-1 px-1 text-[11px] text-muted" title={new Date(m.createdAt).toLocaleString()}>
                  {formatMessageTime(m.createdAt)}
                </span>
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

function RateForm({ exchangeId, peerName, onDone }: { exchangeId: string; peerName: string; onDone: (statsEvent?: Celebration) => void }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await api<{ statsEvent?: Celebration }>(`/api/exchanges/${exchangeId}/complete`, "POST", { stars, comment });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDone(res.data.statsEvent);
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

const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "sessions", label: "Sessions", icon: CalendarDays },
  { id: "video", label: "Video Call", icon: VideoIcon },
  { id: "code", label: "Code", icon: Code2 },
] as const;

export function ExchangeWorkspace({
  exchange, me, initialMessages, initialCodePad,
}: { exchange: ExchangeWithPeer; me: User; initialMessages: MessageRecord[]; initialCodePad: CodePadRecord }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("chat");
  const [scheduling, setScheduling] = useState(false);
  const [rating, setRating] = useState(false);
  const [busySession, setBusySession] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  const iTeach = exchange.viewerRole === "from" ? exchange.offerSkill : exchange.wantSkill;
  const iLearn = exchange.viewerRole === "from" ? exchange.wantSkill : exchange.offerSkill;
  const isActive = exchange.status === "accepted";
  const hasCompletedSession = exchange.sessions.some((s) => s.status === "completed");
  const myRating = exchange.ratings.find((r) => r.by === me.id);
  const sortedSessions = [...exchange.sessions].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  async function sessionAction(sessionId: string, path: "respond" | "complete", body?: object) {
    setBusySession(sessionId);
    setSessionError(null);
    const res = await api<{ statsEvent?: Celebration }>(`/api/exchanges/${exchange.id}/sessions/${sessionId}/${path}`, "POST", body ?? {});
    setBusySession(null);
    if (!res.ok) return setSessionError(res.error);
    if (res.data.statsEvent) setCelebration(res.data.statsEvent);
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

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-white p-1 shadow-soft">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  tab === t.id ? "bg-primary text-white" : "text-muted hover:text-ink"
                }`}
              >
                <t.icon size={15} aria-hidden /> {t.label}
              </button>
            ))}
          </div>
          {tab === "sessions" && isActive && (
            <Button variant="outline" onClick={() => setScheduling(true)}><Calendar size={15} aria-hidden /> Schedule</Button>
          )}
        </div>

        {tab === "chat" && (
          <Chat exchangeId={exchange.id} me={me} initialMessages={initialMessages} canSend={exchange.status !== "declined" && exchange.status !== "cancelled"} />
        )}

        {tab === "sessions" && (
          <>
            {sessionError && <p className="mb-2 text-sm text-red-700">{sessionError}</p>}
            {sortedSessions.length === 0 ? (
              <Card className="text-center text-sm text-muted">No sessions scheduled yet.</Card>
            ) : (
              <div className="space-y-3">
                {sortedSessions.map((s) => {
                  const proposedByMe = s.proposedBy === me.id;
                  const iCompleted = s.completedBy.includes(me.id);
                  const resolved = s.status === "completed" || s.status === "declined" || s.status === "cancelled";
                  return (
                    <Card key={s.id} className={`border-l-[3px] p-4 text-sm ${accentBorder(s.status)} ${resolved ? "opacity-80" : ""}`}>
                      <div className="flex items-start gap-3.5">
                        <SessionTimeTile iso={s.scheduledAt} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted">{s.durationMinutes} min session</p>
                            <SessionStatusBadge status={s.status} />
                          </div>
                          {s.note && <p className="mt-1.5 text-sm text-ink">“{s.note}”</p>}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {s.status === "proposed" && !proposedByMe && (
                              <>
                                <Button onClick={() => sessionAction(s.id, "respond", { action: "confirm" })} disabled={busySession === s.id}>
                                  <Check size={14} aria-hidden /> Confirm
                                </Button>
                                <Button variant="outline" onClick={() => sessionAction(s.id, "respond", { action: "decline" })} disabled={busySession === s.id}>
                                  <X size={14} aria-hidden /> Decline
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
                            {s.status === "completed" && <span className="text-xs font-medium text-emerald-700">Both confirmed · {SESSION_XP_LABEL}</span>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/*
          Once mounted, Video and Code stay mounted even while another tab is
          showing — just visually hidden. Unmounting VideoCall mid-call would
          tear down the live peer connection, and unmounting CodeEditor would
          throw away its in-flight edits and revert to the page's stale
          initial snapshot the next time this tab is opened.
        */}
        {isActive ? (
          <div className={tab === "video" ? "" : "hidden"}>
            <VideoCall exchangeId={exchange.id} peerName={exchange.peer.name} />
          </div>
        ) : (
          tab === "video" && <Card className="text-center text-sm text-muted">Video calls are only available while this swap is active.</Card>
        )}
        <div className={tab === "code" ? "" : "hidden"}>
          <CodeEditor exchangeId={exchange.id} initialPad={initialCodePad} />
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
          <RateForm
            exchangeId={exchange.id}
            peerName={exchange.peer.name.split(" ")[0]}
            onDone={(statsEvent) => {
              setRating(false);
              if (statsEvent) setCelebration(statsEvent);
              router.refresh();
            }}
          />
        </Modal>
      )}
      {celebration && <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />}
    </div>
  );
}
