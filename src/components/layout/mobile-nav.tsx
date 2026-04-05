"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

type MobileNavProps = {
  children: React.ReactNode;
};

export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] -mr-1 bg-transparent border-none cursor-pointer text-[var(--color-deep)] rounded-[var(--radius-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-forest)]"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? t("closeMenu") : t("openMenu")}
      >
        {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
      </button>
      {open && (
        <div
          id="mobile-nav-panel"
          role="navigation"
          aria-label={t("siteNavigation")}
          className="absolute top-14 left-0 right-0 max-h-[min(70vh,24rem)] overflow-y-auto bg-[var(--color-linen)] border-b-[0.5px] border-b-[var(--color-stone)] px-4 py-3 z-50"
        >
          <div
            className="flex flex-col gap-1 pb-[env(safe-area-inset-bottom)]"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
