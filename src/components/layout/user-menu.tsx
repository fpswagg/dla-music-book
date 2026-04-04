"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { User, LogOut, ChevronDown, LayoutDashboard, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { isClientMockMode } from "@/lib/env.client";
import { mockAuth } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/client";

type UserMenuProps = {
  user: { displayName: string; role: string } | null;
  /** Mobile sheet: no chevron dropdown — inline links only */
  variant?: "desktop" | "mobile";
};

export function UserMenu({ user, variant = "desktop" }: UserMenuProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === "mobile") return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  const handleSignOut = async () => {
    setOpen(false);
    if (isClientMockMode()) {
      await mockAuth.signOut();
    } else {
      const supabase = createClient();
      await supabase?.auth.signOut();
    }
    router.refresh();
  };

  const displayLabel =
    user && user.displayName.length > 18
      ? `${user.displayName.slice(0, 16)}…`
      : user?.displayName;

  const linkClass =
    "flex items-center gap-2 px-3 py-2.5 text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline rounded-[var(--radius-sm)] hover:bg-[var(--color-sand)] w-full text-left";

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="flex items-center gap-1.5 text-[13px] text-[var(--color-forest)] font-[var(--font-ui)] no-underline"
      >
        <User size={16} />
        <span>{t("signIn")}</span>
      </Link>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-1 w-full pt-1 border-t-[0.5px] border-t-[var(--color-stone)]">
        <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] m-0 px-3 pt-2">
          {user.displayName}
        </p>
        <Link href="/dashboard" className={linkClass}>
          <LayoutDashboard size={16} className="shrink-0 text-[var(--color-forest)]" />
          <span className="text-[var(--color-forest)]">{t("mySpace")}</span>
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin" className={linkClass}>
            <Shield size={16} className="shrink-0" />
            {t("admin")}
          </Link>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className={`${linkClass} text-[var(--color-text-muted)] cursor-pointer bg-transparent border-none`}
        >
          <LogOut size={16} className="shrink-0" />
          {t("signOut")}
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1.5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 max-w-[160px] sm:max-w-[200px] px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--color-forest)] text-[var(--color-parchment)] text-[13px] font-[var(--font-ui)] no-underline hover:bg-[var(--color-deep)] transition-colors truncate"
        title={user.displayName}
      >
        <LayoutDashboard size={15} className="shrink-0" />
        <span className="truncate">{displayLabel ?? t("mySpace")}</span>
      </Link>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-transparent border-[0.5px] border-[var(--color-stone)] text-[var(--color-deep)] cursor-pointer hover:bg-[var(--color-sand)] transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("accountMenu")}
      >
        <ChevronDown size={16} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[200px] py-1 bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] z-[60]"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:bg-[var(--color-sand)]"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard size={14} />
            {t("dashboard")}
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:bg-[var(--color-sand)]"
              onClick={() => setOpen(false)}
            >
              <Shield size={14} />
              {t("admin")}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)] bg-transparent border-none cursor-pointer hover:bg-[var(--color-sand)]"
          >
            <LogOut size={14} />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
