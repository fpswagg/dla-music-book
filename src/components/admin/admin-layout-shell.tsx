"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AdminHeader
        onOpenNav={() => setMobileNavOpen((o) => !o)}
        navOpen={mobileNavOpen}
      />

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--color-deep)]/20 md:hidden border-none cursor-pointer"
          aria-label={t("closeMenu")}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 overflow-y-auto transition-transform duration-200 ease-out md:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar className="min-h-screen" />
      </aside>

      <aside className="hidden md:flex w-56 shrink-0">
        <AdminSidebar />
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        <div className="hidden md:flex items-center justify-between gap-4 px-6 py-3 border-b-[0.5px] border-b-[var(--color-stone)] bg-[var(--color-linen)] no-print shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] text-[var(--color-forest)] font-[var(--font-ui)] no-underline hover:underline"
          >
            <ArrowLeft size={16} aria-hidden />
            {t("backToSite")}
          </Link>
          <LanguageSwitcher compact />
        </div>
        <main className="flex-1 bg-[var(--color-parchment)] p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
