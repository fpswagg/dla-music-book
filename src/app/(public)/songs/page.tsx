import { Suspense } from "react";
import Link from "next/link";
import { getSongs, getTags, getLanguages } from "@/lib/data-provider";
import { SongCard } from "@/components/ui/song-card";
import { SectionLabel } from "@/components/ui/section-label";
import { SongCatalogClient } from "@/components/songs/song-catalog-client";
import { getTranslations } from "next-intl/server";

export default async function SongsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const t = await getTranslations("songs");
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const lang = searchParams.lang || "";
  const mood = searchParams.mood || "";

  const [{ songs, total }, tags, languages] = await Promise.all([
    getSongs({ q: q || undefined, language: lang || undefined, mood: mood || undefined, status: "FINISHED" }),
    getTags(),
    getLanguages(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("title")}
      </h1>

      <Suspense>
        <SongCatalogClient
          initialQuery={q}
          tags={tags}
          languages={languages}
          activeLang={lang}
          activeMood={mood}
        />
      </Suspense>

      <div className="mt-4 mb-2">
        <SectionLabel>{t("found", { count: total })}</SectionLabel>
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

      {songs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[14px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
            {t("noResults")}
          </p>
        </div>
      )}
    </div>
  );
}
