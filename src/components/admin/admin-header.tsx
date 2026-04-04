"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

type AdminHeaderProps = {
  onOpenNav: () => void;
  navOpen: boolean;
};

export function AdminHeader({ onOpenNav, navOpen }: AdminHeaderProps) {
  const t = useTranslations("admin");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b-[0.5px] border-b-[var(--color-stone)] bg-[var(--color-linen)] no-print md:hidden">
      <button
        type="button"
        onClick={onOpenNav}
        className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] bg-transparent border-[0.5px] border-[var(--color-stone)] text-[var(--color-deep)] cursor-pointer hover:bg-[var(--color-sand)]"
        aria-expanded={navOpen}
        aria-label={navOpen ? t("closeMenu") : t("openMenu")}
      >
        {navOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <Link
        href="/"
        className="text-[13px] text-[var(--color-forest)] font-[var(--font-ui)] no-underline hover:underline truncate max-w-[45%]"
      >
        {t("backToSite")}
      </Link>
      <LanguageSwitcher compact />
    </header>
  );
}
