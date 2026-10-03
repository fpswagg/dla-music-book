"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[var(--radius-md)] text-[13px] text-text-body bg-transparent border-[0.5px] border-stone cursor-pointer hover:bg-sand"
    >
      <Printer size={15} /> {label}
    </button>
  );
}

/** Opens the print dialog once the page has rendered (links with ?print=1). */
export function AutoPrint() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 400);
    return () => clearTimeout(id);
  }, []);
  return null;
}
