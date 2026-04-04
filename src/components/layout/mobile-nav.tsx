"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

type MobileNavProps = {
  children: React.ReactNode;
};

export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer text-[var(--color-deep)]"
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-[var(--color-linen)] border-b-[0.5px] border-b-[var(--color-stone)] px-4 py-3 z-50">
          <div
            className="flex flex-col gap-3"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
