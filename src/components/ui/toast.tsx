"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, visible, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-parchment border-[0.5px] border-forest rounded-[var(--radius-md)] px-4 py-3 animate-[fadeIn_150ms_ease-out]"
    >
      <Check size={14} className="text-forest" />
      <span className="text-[13px] text-deep font-ui">{message}</span>
      <button type="button" onClick={onClose} className="ml-2 text-text-muted hover:text-deep bg-transparent border-none cursor-pointer" aria-label="×">
        <X size={12} />
      </button>
    </div>
  );
}
