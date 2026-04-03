"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, visible, onClose, duration = 2000 }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 200);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible && !show) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-forest)] rounded-[var(--radius-md)] px-4 py-3 transition-all ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <Check size={14} className="text-[var(--color-forest)]" />
      <span className="text-[13px] text-[var(--color-deep)] font-[var(--font-ui)]">{message}</span>
      <button onClick={() => { setShow(false); setTimeout(onClose, 200); }} className="ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-deep)] bg-transparent border-none cursor-pointer">
        <X size={12} />
      </button>
    </div>
  );
}
