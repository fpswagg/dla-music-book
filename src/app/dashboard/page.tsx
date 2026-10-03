import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, ListMusic } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  getUserLikedSongs,
  getUserCollections,
  getCollectionSongSummaries,
} from "@/lib/data-provider";
import { BackLink } from "@/components/ui/back-link";
import { SectionLabel } from "@/components/ui/section-label";
import { SongCard } from "@/components/ui/song-card";
import { DashboardCollections } from "@/components/dashboard/dashboard-collections";
import { getTranslatedName } from "@/lib/i18n-helpers";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/dashboard");

  const [t, locale, likedSongs, collections] = await Promise.all([
    getTranslations("dashboard"),
    getLocale(),
    getUserLikedSongs(user.id),
    getUserCollections(user.id),
  ]);

  const collectionsWithSongs = await Promise.all(
    collections.map(async (c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      isPublic: c.isPublic,
      songs: await getCollectionSongSummaries(c.id, user.id),
    })),
  );

  return (
    <div>
      <BackLink href="/" label={t("backToHome")} />

      <h1 className="text-[24px] sm:text-[28px] text-[var(--color-deep)] font-display mb-6 text-balance">
        {t("title")}
      </h1>

      <Link
        href="/dashboard/programmes"
        className="flex items-center gap-3 mb-10 p-4 bg-linen rounded-[var(--radius-lg)] border-[0.5px] border-stone no-underline hover:border-forest"
      >
        <ListMusic size={20} className="text-forest shrink-0" />
        <span>
          <span className="block font-display text-[17px] text-deep">{t("programmes")}</span>
          <span className="block text-[13px] text-text-muted">{t("programmesText")}</span>
        </span>
      </Link>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>{t("myCollections")}</SectionLabel>
        </div>
        {collectionsWithSongs.length === 0 && (
          <p className="text-[13px] text-[var(--color-text-muted)] font-ui mb-4 m-0">
            {t("noCollections")}
          </p>
        )}
        <DashboardCollections initialCollections={collectionsWithSongs} />
      </div>

      <div>
        <SectionLabel>{t("likedSongs")}</SectionLabel>
        {likedSongs.length === 0 ? (
          <div className="bg-[var(--color-linen)] rounded-[var(--radius-md)] p-8 text-center">
            <Heart size={24} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
            <p className="text-[13px] text-[var(--color-text-muted)] font-ui m-0">
              {t("noLikes")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {likedSongs.map((song) => (
              <SongCard
                  key={song.id}
                  songId={song.id}
                  index={song.index}
                  title={song.title}
                  meta={song.authors.map((a) => a.name).join(", ")}
                  tags={song.tags.map((tag) => ({
                    name: getTranslatedName(tag.name, locale),
                    isMood: tag.category === "MOOD",
                  }))}
                  likeCount={song._count?.likes ?? 0}
                  isLiked
                />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
