import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { getHymnals, getLanguages, getSongs, getTags, getUserLikedSongIds } from "@/lib/data-provider";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { firstLine } from "@/lib/lyrics";
import { SongCard } from "@/components/ui/song-card";
import { SectionLabel } from "@/components/ui/section-label";
import { SongCatalogClient } from "@/components/songs/song-catalog-client";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

export async function generateMetadata(): Promise<Metadata> {
  const [t, tm] = await Promise.all([getTranslations("songs"), getTranslations("meta")]);
  return { title: t("title"), description: tm("description") };
}

export default async function SongsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const lang = searchParams.lang || "";
  const tag = searchParams.tag || searchParams.mood || "";
  const hymnal = searchParams.hymnal || "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [t, locale, user, { songs, total }, tags, languages, hymnals] = await Promise.all([
    getTranslations("songs"),
    getLocale(),
    getCurrentUser(),
    getSongs({
      q: q || undefined,
      language: lang || undefined,
      tag: tag || undefined,
      hymnal: hymnal || undefined,
      status: "FINISHED",
      page,
      limit: PAGE_SIZE,
    }),
    getTags(),
    getLanguages(),
    getHymnals(),
  ]);

  const likedMap = user && songs.length ? await getUserLikedSongIds(user.id, songs.map((s) => s.id)) : {};

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <h1 className="text-[26px] sm:text-[30px] text-deep font-display mb-5 text-balance">{t("title")}</h1>

      <Suspense>
        <SongCatalogClient
          initialQuery={q}
          tags={tags}
          languages={languages}
          hymnals={hymnals.filter((h) => h.songCount > 0).map((h) => ({ code: h.code, name: h.name }))}
          activeLang={lang}
          activeTag={tag}
          activeHymnal={hymnal}
        />
      </Suspense>

      <div className="mt-5 mb-2">
        <SectionLabel>{t("found", { count: total })}</SectionLabel>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {songs.map((song) => {
          const v = song.versions[0];
          return (
            <SongCard
              key={song.id}
              songId={song.id}
              index={song.index}
              title={song.title}
              firstLine={v ? firstLine(v.content) : undefined}
              references={song.references.map((r) => `${r.code} ${r.number}`).join(" – ")}
              meta={song.authors.map((a) => a.name).join(", ")}
              tags={song.tags.map((tg) => ({ name: getTranslatedName(tg.name, locale), isMood: tg.category === "MOOD" }))}
              likeCount={user ? (song._count?.likes ?? 0) : undefined}
              isLiked={user ? likedMap[song.id] : undefined}
            />
          );
        })}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={44} className="mx-auto mb-4 text-stone" />
          <p className="text-[14px] text-text-muted">{t("noResults")}</p>
        </div>
      )}

      {songs.length > 0 && (
        <Pagination pathname="/songs" searchParams={searchParams} page={page} total={total} pageSize={PAGE_SIZE} />
      )}
    </div>
  );
}
