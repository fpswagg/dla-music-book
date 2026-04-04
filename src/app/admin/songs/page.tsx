import Link from "next/link";
import { getSongs } from "@/lib/data-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminSongsListToolbar } from "@/components/admin/admin-list-toolbar";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

export default async function AdminSongsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const { songs, total } = await getSongs({
    q: q || undefined,
    status: status === "DRAFT" || status === "FINISHED" ? status : undefined,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)]">{t("songs")}</h1>
        <Link href="/admin/songs/new">
          <Button size="sm">
            <Plus size={14} /> {t("addSong")}
          </Button>
        </Link>
      </div>

      <AdminSongsListToolbar />

      <SectionLabel>{t("songsCount", { count: total })}</SectionLabel>

      <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] overflow-hidden mt-2">
        <table className="w-full">
          <thead>
            <tr className="border-b-[0.5px] border-b-[var(--color-stone)]">
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableIndex")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableTitle")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableAuthor")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableStatus")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableActions")}</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song) => (
              <tr key={song.id} className="border-b-[0.5px] border-b-[var(--color-stone)] last:border-b-0 even:bg-[var(--color-linen)] hover:bg-[var(--color-sand)] transition-colors">
                <td className="px-4 py-3 text-[14px] text-[var(--color-stone)] font-[var(--font-display)]">{String(song.index).padStart(2, "0")}</td>
                <td className="px-4 py-3 text-[14px] text-[var(--color-deep)] font-[var(--font-display)]">{song.title}</td>
                <td className="px-4 py-3 text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)]">{song.authors.map((a) => a.name).join(", ")}</td>
                <td className="px-4 py-3"><StatusBadge status={song.status.toLowerCase() as "finished" | "draft"} /></td>
                <td className="px-4 py-3">
                  <Link href={`/admin/songs/${song.id}/edit`} className="text-[12px] text-[var(--color-forest)] font-[var(--font-ui)] no-underline hover:underline">
                    {tc("edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        pathname="/admin/songs"
        searchParams={searchParams}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
