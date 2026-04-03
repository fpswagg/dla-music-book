import Link from "next/link";
import { getSongs, getStats } from "@/lib/data-provider";
import { SongCard } from "@/components/ui/song-card";
import { SectionLabel } from "@/components/ui/section-label";
import { StatCard } from "@/components/ui/stat-card";
import { Search, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  const [{ songs }, stats] = await Promise.all([
    getSongs({ status: "FINISHED", limit: 6 }),
    getStats(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center py-12">
        <h1 className="text-[32px] text-[var(--color-deep)] font-[var(--font-display)] mb-3">
          {t("title")}
        </h1>
        <p className="text-[14px] text-[var(--color-green-muted)] font-[var(--font-ui)] max-w-md mx-auto mb-8">
          {t("subtitle")}
        </p>
        <Link
          href="/songs"
          className="inline-flex items-center gap-2 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-4 py-2.5 text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)] no-underline hover:border-[var(--color-forest)] hover:bg-[var(--color-parchment)] transition-colors"
        >
          <Search size={16} />
          {t("searchPlaceholder")}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        <StatCard value={stats.totalSongs} label={t("totalHymns")} />
        <StatCard value={stats.finishedSongs} label={t("completed")} />
        <StatCard value={stats.draftSongs} label={t("inProgress")} />
        <StatCard value={stats.totalCollections} label={t("collections")} />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>{t("featured")}</SectionLabel>
          <Link href="/songs" className="flex items-center gap-1 text-[12px] text-[var(--color-forest)] font-[var(--font-ui)] no-underline hover:underline">
            {t("browseAll")} <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {songs.map((song) => (
            <Link key={song.id} href={`/songs/${song.id}`} className="no-underline">
              <SongCard
                index={song.index}
                title={song.title}
                meta={song.authors.map((a) => a.name).join(", ")}
                status={song.status.toLowerCase() as "finished" | "draft"}
                tags={song.tags.map((t) => ({
                  name: t.name,
                  isMood: t.category === "MOOD",
                }))}
                likeCount={song._count?.likes ?? 0}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
