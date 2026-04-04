"use client";

import { useTranslations } from "next-intl";
import { NavItem } from "@/components/ui/nav-item";
import { ADMIN_NAV } from "@/components/admin/admin-nav";

export function AdminSidebar({ className = "" }: { className?: string }) {
  const t = useTranslations("admin");

  return (
    <aside
      className={`w-56 bg-[var(--color-linen)] border-r-[0.5px] border-r-[var(--color-stone)] py-4 shrink-0 no-print flex flex-col ${className}`}
    >
      <div className="px-4 mb-6">
        <h2 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)]">{t("title")}</h2>
        <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("dashboard")}</p>
      </div>
      <nav className="flex flex-col">
        {ADMIN_NAV.map((item) => (
          <NavItem key={item.href} href={item.href} icon={item.icon} label={t(item.labelKey)} />
        ))}
      </nav>
    </aside>
  );
}
