import { SectionLabel } from "@/components/ui/section-label";
import { StatCard } from "@/components/ui/stat-card";
import { getTotalAnalytics, getTopSongs, getTopSearches, getViewsOverTime } from "@/lib/analytics/aggregator";
import { getTranslations } from "next-intl/server";

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("adminAnalytics");
  const [stats, topSongs, topSearches, viewsData] = await Promise.all([
    getTotalAnalytics(),
    getTopSongs(10),
    getTopSearches(10),
    getViewsOverTime(7),
  ]);

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">{t("title")}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard value={stats.totalViews} label={t("totalPageViews")} />
        <StatCard value={stats.songViews} label={t("songViews")} />
        <StatCard value={stats.uniqueSearches} label={t("searches")} />
        <StatCard value={stats.avgDailyViews} label={t("avgDailyViews")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <SectionLabel>{t("viewsLastDays")}</SectionLabel>
          <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4">
            <div className="flex items-end gap-2 h-32">
              {viewsData.map((d) => {
                const max = Math.max(...viewsData.map((v) => v.views), 1);
                const height = (d.views / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{d.views}</span>
                    <div
                      className="w-full bg-[var(--color-forest)] rounded-t-[3px] transition-all"
                      style={{ height: `${height}%`, minHeight: "2px" }}
                    />
                    <span className="text-[9px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>{t("topSongs")}</SectionLabel>
          <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] overflow-hidden">
            {topSongs.map((song, i) => (
              <div key={song.songId} className="flex items-center px-4 py-2.5 border-b-[0.5px] border-b-[var(--color-stone)] last:border-b-0">
                <span className="text-[12px] text-[var(--color-stone)] font-[var(--font-ui)] w-6">{i + 1}.</span>
                <span className="text-[13px] text-[var(--color-deep)] font-[var(--font-ui)] flex-1">{song.songTitle}</span>
                <span className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("views", { count: song.views })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionLabel>{t("topSearches")}</SectionLabel>
      <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] overflow-hidden max-w-lg">
        {topSearches.map((s, i) => (
          <div key={s.query} className="flex items-center px-4 py-2.5 border-b-[0.5px] border-b-[var(--color-stone)] last:border-b-0">
            <span className="text-[12px] text-[var(--color-stone)] font-[var(--font-ui)] w-6">{i + 1}.</span>
            <span className="text-[13px] text-[var(--color-deep)] font-[var(--font-ui)] flex-1">&ldquo;{s.query}&rdquo;</span>
            <span className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{s.count}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}
