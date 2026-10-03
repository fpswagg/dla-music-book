import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BarChart3, CheckCircle2, CircleAlert, Music, PenLine, Plus, Upload, Users } from "lucide-react";
import { getStats } from "@/lib/data-provider";
import { getIntegrationsStatus, isMockMode } from "@/lib/config";
import { StatCard } from "@/components/ui/stat-card";
import { SectionLabel } from "@/components/ui/section-label";

export default async function AdminOverviewPage() {
  const [t, stats] = await Promise.all([getTranslations("admin"), getStats()]);
  const integrations = getIntegrationsStatus();

  const action = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[12px] no-underline";

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-[28px] text-deep font-display m-0">{t("overview")}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/songs/new" className={`${action} bg-forest text-parchment`}>
            <Plus size={14} /> {t("addSong")}
          </Link>
          <Link href="/admin/import" className={`${action} bg-linen border-[0.5px] border-stone text-text-body`}>
            <Upload size={14} /> {t("import")}
          </Link>
          <Link href="/admin/analytics" className={`${action} bg-linen border-[0.5px] border-stone text-text-body`}>
            <BarChart3 size={14} /> {t("analytics")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard value={stats.totalSongs} label={t("totalSongs")} icon={<Music size={18} />} />
        <StatCard value={stats.finishedSongs} label={t("finished")} icon={<CheckCircle2 size={18} />} />
        <StatCard value={stats.draftSongs} label={t("drafts")} icon={<PenLine size={18} />} />
        <StatCard value={stats.totalUsers} label={t("users")} icon={<Users size={18} />} />
      </div>

      <SectionLabel>{t("integrations")}</SectionLabel>
      {isMockMode() && <p className="text-[12px] text-amber bg-amber-light rounded-[var(--radius-md)] px-3 py-2 mb-3">{t("integrationsDemo")}</p>}
      <ul className="list-none p-0 m-0 mb-8 grid gap-2 sm:grid-cols-2">
        {integrations.map((i) => (
          <li key={i.key} className="flex gap-3 items-start bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] px-4 py-3">
            {i.ok ? (
              <CheckCircle2 size={18} className="text-forest shrink-0 mt-0.5" aria-hidden />
            ) : (
              <CircleAlert size={18} className={`${i.required ? "text-danger" : "text-amber"} shrink-0 mt-0.5`} aria-hidden />
            )}
            <div className="min-w-0">
              <p className="m-0 text-[14px] text-deep">
                {t(`integration.${i.key}.name`)}{" "}
                <span className="text-[11px] text-text-muted">· {i.required ? t("required") : t("optional")}</span>
              </p>
              <p className="m-0 text-[12px] text-text-muted leading-snug">
                {i.ok ? t(`integration.${i.key}.on`) : t(`integration.${i.key}.off`)}
              </p>
              {!i.ok && <p className="m-0 mt-1 text-[11px] text-text-muted font-mono">{i.env.join(" + ")}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
