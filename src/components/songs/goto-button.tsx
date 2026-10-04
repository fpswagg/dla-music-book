"use client";

import { Hash } from "lucide-react";
import { openGoTo } from "./goto-hymn";

export function GoToButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => openGoTo()}
      className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-[var(--radius-md)] bg-forest text-parchment border-none text-[13px] cursor-pointer"
    >
      <Hash size={15} /> {label}
    </button>
  );
}
