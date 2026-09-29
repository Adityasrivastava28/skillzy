"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Card } from "./Card";

export function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-surface hover:text-ink">
              <X size={18} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </Card>
    </div>
  );
}
