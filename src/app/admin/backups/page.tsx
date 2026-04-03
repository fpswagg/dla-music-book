import { SectionLabel } from "@/components/ui/section-label";
import { listBackups } from "@/lib/backup/manager";
import { isMockMode } from "@/lib/env";
import { BackupActions } from "@/components/admin/backup-actions";
import { getTranslations } from "next-intl/server";

export default async function AdminBackupsPage() {
  const t = await getTranslations("adminBackup");
  const backups = await listBackups();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)]">{t("title")}</h1>
        <BackupActions />
      </div>

      {isMockMode() && (
        <div className="bg-[var(--color-amber-light)] rounded-[var(--radius-md)] px-3 py-2 mb-4 text-[12px] text-[var(--color-amber)] font-[var(--font-ui)]">
          {t("requiresDb")}
        </div>
      )}

      <SectionLabel>{t("backupHistory")}</SectionLabel>

      {backups.length === 0 ? (
        <div className="bg-[var(--color-linen)] rounded-[var(--radius-md)] p-8 text-center">
          <p className="text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
            {t("noBackups")}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-b-[var(--color-stone)]">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("filename")}</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("size")}</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.name} className="border-b-[0.5px] border-b-[var(--color-stone)] last:border-b-0">
                  <td className="px-4 py-3 text-[13px] text-[var(--color-deep)] font-[var(--font-ui)]">{backup.name}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{(backup.size / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{new Date(backup.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
