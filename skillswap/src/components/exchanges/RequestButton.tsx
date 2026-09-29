"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorNote } from "@/components/forms/ErrorNote";
import { inputCls } from "@/components/forms/Field";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

/**
 * Real skill exchange request: you can only offer a skill you actually
 * listed as something you teach, and only request one they actually teach.
 */
export function RequestButton({ me, peer }: { me: User; peer: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [offerSkill, setOfferSkill] = useState(me.canTeach[0] ?? "");
  const [wantSkill, setWantSkill] = useState(peer.canTeach[0] ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const canRequest = me.canTeach.length > 0 && peer.canTeach.length > 0;

  async function submit() {
    setError(null);
    setLoading(true);
    const res = await api("/api/exchanges", "POST", { toUserId: peer.id, offerSkill, wantSkill, note });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSent(true);
    router.refresh();
  }

  if (!canRequest) return null;

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Request exchange
      </Button>
      {open && (
        <Modal title={`Swap with ${peer.name.split(" ")[0]}`} onClose={() => setOpen(false)}>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink">Request sent to {peer.name.split(" ")[0]}. You'll see it in your Requests once they respond.</p>
              <Button className="w-full" onClick={() => setOpen(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="offerSkill" className="mb-1.5 block text-sm font-medium">You'll teach</label>
                <select id="offerSkill" className={inputCls} value={offerSkill} onChange={(e) => setOfferSkill(e.target.value)}>
                  {me.canTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="wantSkill" className="mb-1.5 block text-sm font-medium">You'll learn</label>
                <select id="wantSkill" className={inputCls} value={wantSkill} onChange={(e) => setWantSkill(e.target.value)}>
                  {peer.canTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium">Note (optional)</label>
                <textarea
                  id="note"
                  rows={3}
                  maxLength={500}
                  className={inputCls}
                  placeholder={`Hi ${peer.name.split(" ")[0]}, I'd love to swap...`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <ErrorNote message={error} />
              <Button className="w-full" onClick={submit}>{loading ? "Sending…" : "Send request"}</Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
