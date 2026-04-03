import { getStats } from "@/lib/data-provider";
import { StatCard } from "@/components/ui/stat-card";
import { SectionLabel } from "@/components/ui/section-label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin");
  const stats = await getStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)]">{t("overview")}</h1>
        <div className="flex gap-2">
          <Link href="/admin/songs/new"><Button size="sm"><Plus size={14} /> {t("addSong")}</Button></Link>
          <Link href="/admin/analytics"><Button variant="secondary" size="sm"><BarChart3 size={14} /> {t("analytics")}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard value={stats.totalSongs} label={t("totalSongs")} />
        <StatCard value={stats.finishedSongs} label={t("finished")} />
        <StatCard value={stats.draftSongs} label={t("drafts")} />
        <StatCard value={stats.totalUsers} label={t("users")} />
      </div>

      <SectionLabel>{t("quickLinks")}</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/songs" className="no-underline bg-[var(--color-linen)] rounded-[var(--radius-md)] p-4 hover:bg-[var(--color-sand)] transition-colors text-center">
          <span className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)]">{t("manageSongs")}</span>
        </Link>
        <Link href="/admin/users" className="no-underline bg-[var(--color-linen)] rounded-[var(--radius-md)] p-4 hover:bg-[var(--color-sand)] transition-colors text-center">
          <span className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)]">{t("manageUsers")}</span>
        </Link>
        <Link href="/admin/tags" className="no-underline bg-[var(--color-linen)] rounded-[var(--radius-md)] p-4 hover:bg-[var(--color-sand)] transition-colors text-center">
          <span className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)]">{t("manageTags")}</span>
        </Link>
        <Link href="/admin/backups" className="no-underline bg-[var(--color-linen)] rounded-[var(--radius-md)] p-4 hover:bg-[var(--color-sand)] transition-colors text-center">
          <span className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)]">{t("backups")}</span>
        </Link>
      </div>
    </div>
  );
}
