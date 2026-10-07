"use client";

import { Trophy, Sparkles, Gift } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface Celebration {
  xpAwarded: number;
  leveledUp: boolean;
  newLevel: number;
  firstSwapBonus: boolean;
}

/**
 * Shown right after an action that actually awarded XP (a confirmed session
 * or a closed-out swap) — every number here comes straight from the stats
 * event the server returned for that real action, never invented client-side.
 */
export function CelebrationModal({ celebration, onClose }: { celebration: Celebration; onClose: () => void }) {
  const Icon = celebration.leveledUp ? Trophy : celebration.firstSwapBonus ? Gift : Sparkles;
  return (
    <Modal title={celebration.leveledUp ? "Level up!" : "Nice work!"} onClose={onClose}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-accent">
          <Icon size={32} aria-hidden />
        </span>
        <p className="text-2xl font-bold text-ink">+{celebration.xpAwarded} XP</p>
        {celebration.leveledUp && (
          <p className="text-sm font-medium text-primary">You reached Level {celebration.newLevel}!</p>
        )}
        {celebration.firstSwapBonus && (
          <p className="text-sm text-muted">Includes your +50 XP first-swap bonus 🎉</p>
        )}
        <Button className="mt-2 w-full" onClick={onClose}>Nice!</Button>
      </div>
    </Modal>
  );
}
