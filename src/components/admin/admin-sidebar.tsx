"use client";

import { useTranslations } from "next-intl";
import { NavItem } from "@/components/ui/nav-item";
import { LayoutDashboard, Music, Users, Tag, Pen, FolderOpen, BarChart3, Database } from "lucide-react";

export function AdminSidebar() {
  const t = useTranslations("admin");

  return (
    <aside className="w-56 bg-[var(--color-linen)] border-r-[0.5px] border-r-[var(--color-stone)] py-4 shrink-0 no-print">
      <div className="px-4 mb-6">
        <h2 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)]">{t("title")}</h2>
        <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("dashboard")}</p>
      </div>
      <nav className="flex flex-col">
        <NavItem href="/admin" icon={LayoutDashboard} label={t("overview")} />
        <NavItem href="/admin/songs" icon={Music} label={t("songs")} />
        <NavItem href="/admin/authors" icon={Pen} label={t("authors")} />
        <NavItem href="/admin/tags" icon={Tag} label={t("tags")} />
        <NavItem href="/admin/collections" icon={FolderOpen} label={t("collections")} />
        <NavItem href="/admin/users" icon={Users} label={t("users")} />
        <NavItem href="/admin/analytics" icon={BarChart3} label={t("analytics")} />
        <NavItem href="/admin/backups" icon={Database} label={t("backups")} />
      </nav>
    </aside>
  );
}
