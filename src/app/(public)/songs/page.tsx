import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSongs, getTags, getLanguages, getUserLikedSongIds } from "@/lib/data-provider";
import { SongCard } from "@/components/ui/song-card";
import { SectionLabel } from "@/components/ui/section-label";
import { SongCatalogClient } from "@/components/songs/song-catalog-client";
import { getTranslations, getLocale } from "next-intl/server";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Music } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const [t, tm] = await Promise.all([getTranslations("songs"), getTranslations("meta")]);
  return {
    title: t("title"),
    description: tm("description"),
  };
}

export default async function SongsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [t, locale] = await Promise.all([getTranslations("songs"), getLocale()]);
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const lang = searchParams.lang || "";
  const tag = searchParams.tag || searchParams.mood || "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [user, { songs, total }, tags, languages] = await Promise.all([
    getCurrentUser(),
    getSongs({
      q: q || undefined,
      language: lang || undefined,
      tag: tag || undefined,
      status: "FINISHED",
      page,
      limit: PAGE_SIZE,
    }),
    getTags(),
    getLanguages(),
  ]);

  const likedMap =
    user && songs.length > 0
      ? await getUserLikedSongIds(
          user.id,
          songs.map((s) => s.id),
        )
      : {};

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
          activeTag={tag}
        />
      </Suspense>

      <div className="mt-4 mb-2">
        <SectionLabel>{t("found", { count: total })}</SectionLabel>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.map((song) => (
          <Link key={song.id} href={`/songs/${song.id}`} className="no-underline">
            <SongCard
              songId={song.id}
              index={song.index}
              title={song.title}
              meta={song.authors.map((a) => a.name).join(", ")}
              tags={song.tags.map((tg) => ({
                name: typeof tg.name === "string" ? tg.name : getTranslatedName(tg.name, locale),
                isMood: tg.category === "MOOD",
              }))}
              likeCount={song._count?.likes ?? 0}
              isLiked={user ? likedMap[song.id] : undefined}
            />
          </Link>
        ))}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-16">
          <div className="mb-4">
            <Music size={48} className="mx-auto text-[var(--color-stone)]" />
          </div>
          <p className="text-[14px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
            {t("noResults")}
          </p>
        </div>
      )}

      {songs.length > 0 && (
        <Pagination
          pathname="/songs"
          searchParams={searchParams}
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
