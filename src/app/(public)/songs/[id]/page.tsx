import { notFound } from "next/navigation";
import { getSongById, getUserLikedSongIds } from "@/lib/data-provider";
import { Tag } from "@/components/ui/tag";
import { SectionLabel } from "@/components/ui/section-label";
import { SongDetailClient } from "@/components/songs/song-detail-client";
import { LyricsDisplay } from "@/components/songs/lyrics-display";
import { LikeButton } from "@/components/songs/like-button";
import { getTranslations, getLocale } from "next-intl/server";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { getCurrentUser } from "@/lib/auth-helpers";
import { BackLink } from "@/components/ui/back-link";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await getSongById(id);
  const t = await getTranslations("song");
  if (!song) return { title: t("notFound") };
  const firstLines = song.versions[0]?.lyrics.split("\n").slice(0, 2).join(" · ") ?? "";
  return {
    title: `${song.index}. ${song.title} — ${t("titleSuffix")}`,
    description: `${firstLines} — ${song.authors.map((a) => a.name).join(", ")}`,
    openGraph: {
      title: `${song.index}. ${song.title}`,
      description: `${firstLines} — ${song.authors.map((a) => a.name).join(", ")}`,
      type: "music.song",
    },
  };
}

export default async function SongDetailPage({ params }: Props) {
  const { id } = await params;
  const [song, locale, user] = await Promise.all([
    getSongById(id),
    getLocale(),
    getCurrentUser(),
  ]);
  if (!song) notFound();
  if (song.status !== "FINISHED" && user?.role !== "ADMIN") notFound();

  const t = await getTranslations("song");
  const currentVersion = song.versions[0];
  const lines = currentVersion?.lyrics.split("\n") ?? [];
  const annotations = currentVersion?.annotations ?? [];

  const likeCount = song._count?.likes ?? 0;
  const likedMap = user
    ? await getUserLikedSongIds(user.id, [song.id])
    : {};
  const isLiked = likedMap[song.id] ?? false;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <BackLink href="/songs" label={t("backToHymns")} />

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 mb-3">
          <span className="text-[26px] sm:text-[32px] leading-none text-[var(--color-stone)] font-[var(--font-display)] shrink-0">
            {String(song.index).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] sm:text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-1 text-balance">
              {song.title}
            </h1>
            <p className="text-[14px] text-[var(--color-green-muted)] font-[var(--font-ui)]">
              {song.authors.map((a) => a.name).join(", ")}
            </p>
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-1.5 mb-4">
          {song.languages.map((l) => (
            <Tag key={l.code} label={getTranslatedName(l.name, locale)} />
          ))}
          {song.tags.map((tag) => {
            const tagName = getTranslatedName(tag.name, locale);
            const key = tag.key ?? "";
            const href = key ? `/songs?tag=${encodeURIComponent(key)}` : `/songs?q=${encodeURIComponent(tagName)}`;
            return (
              <Tag
                key={tag.id}
                label={tagName}
                variant={tag.category === "MOOD" ? "mood" : "keyword"}
                href={href}
              />
            );
          })}
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <SongDetailClient songId={song.id} />
          {user && (
            <LikeButton
              songId={song.id}
              initialLiked={isLiked}
              initialCount={likeCount}
              size="md"
            />
          )}
        </div>
      </div>

      {currentVersion && currentVersion.previews.length > 0 && (
        <div className="no-print mb-8">
          <SectionLabel>{t("listen")}</SectionLabel>
          <div className="flex flex-col gap-3">
            {currentVersion.previews.map((p) => (
              <div
                key={p.id}
                className="bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-3"
              >
                <audio
                  controls
                  preload="metadata"
                  className="w-full max-w-full"
                  src={p.fileUrl}
                >
                  {t("audioNotSupported")}
                </audio>
                {p.durationSeconds > 0 && (
                  <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] m-0 mt-2">
                    {t("previewDuration", { seconds: p.durationSeconds })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {song.versions.length > 1 && (
        <div className="no-print mb-6">
          <SectionLabel>{t("versions")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {song.versions.map((v) => (
              <span
                key={v.id}
                className="px-3 py-1 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] bg-[var(--color-sand)] text-[var(--color-text-body)]"
              >
                v{v.versionNumber} — {v.versionType.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <SectionLabel>{t("lyrics")}</SectionLabel>
        <LyricsDisplay lines={lines} annotations={annotations} />
      </div>

      {song.notes.length > 0 && (
        <div className="mb-8">
          <SectionLabel>{t("notes")}</SectionLabel>
          <div className="space-y-3">
            {song.notes.map((note) => (
              <div key={note.id} className="bg-[var(--color-linen)] rounded-[var(--radius-md)] px-4 py-3 border-l-2 border-l-[var(--color-stone)]">
                <p className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] italic leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
