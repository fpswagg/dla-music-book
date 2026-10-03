import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAdjacentSongs, getSongByParam, getUserLikedSongIds } from "@/lib/data-provider";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { firstLine, plainLyrics } from "@/lib/lyrics";
import { normalizeForSearch } from "@/lib/duala";
import { Tag } from "@/components/ui/tag";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/ui/back-link";
import { LikeButton } from "@/components/songs/like-button";
import { LyricsView } from "@/components/songs/lyrics-view";
import { HymnHeader } from "@/components/songs/hymn-header";
import { HymnActions, HymnPager } from "@/components/songs/hymn-actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [song, t] = await Promise.all([getSongByParam(id), getTranslations("song")]);
  if (!song || song.status !== "FINISHED") return { title: t("notFound") };
  const content = song.versions[0]?.content;
  const excerpt = content ? plainLyrics(content).split("\n").filter(Boolean).slice(0, 2).join(" · ") : "";
  return {
    title: `${song.index}. ${song.title}`,
    description: excerpt,
    alternates: { canonical: `/songs/${song.index}` },
    openGraph: { title: `${song.index}. ${song.title}`, description: excerpt, type: "music.song", url: `/songs/${song.index}` },
  };
}

export default async function SongPage({ params, searchParams }: Props) {
  const [{ id }, { v }] = await Promise.all([params, searchParams]);
  const [song, locale, user, t] = await Promise.all([getSongByParam(id), getLocale(), getCurrentUser(), getTranslations("song")]);
  if (!song) notFound();
  if (song.status !== "FINISHED" && user?.role !== "ADMIN") notFound();
  // Old links used the database id; the hymn number is the canonical address.
  if (!/^\d+$/.test(id)) permanentRedirect(`/songs/${song.index}`);

  const version = song.versions.find((x) => String(x.versionNumber) === v) ?? song.versions[0];
  const [adjacent, likedMap] = await Promise.all([
    getAdjacentSongs(song.index),
    user ? getUserLikedSongIds(user.id, [song.id]) : Promise.resolve({} as Record<string, boolean>),
  ]);

  const meta = [
    song.authors.map((a) => a.name).join(", "),
    song.tune ? t("tune", { tune: song.tune }) : null,
    song.page ? t("bookPage", { page: song.page }) : null,
  ].filter(Boolean);

  return (
    <article className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="no-print flex items-center justify-between gap-3 mb-6">
        <BackLink href="/songs" label={t("backToHymns")} />
        {user?.role === "ADMIN" && (
          <Link href={`/admin/songs/${song.id}/edit`} className="text-[12px] text-forest">
            {t("edit")}
          </Link>
        )}
      </div>

      <div className="print-hymn">
        <HymnHeader
          index={song.index}
          title={song.title}
          hideTitle={!!version && normalizeForSearch(song.title) === normalizeForSearch(firstLine(version.content))}
          references={song.references}
          meta={meta.length ? meta.join(" · ") : undefined}
        />
        {song.status !== "FINISHED" && (
          <p className="no-print text-center mt-3">
            <span className="inline-block px-2.5 py-0.5 rounded-[var(--radius-pill)] bg-sand text-text-muted text-[11px]">{t("draftBadge")}</span>
          </p>
        )}

        <div className="mt-6 mb-8">
          <HymnActions songId={song.id} index={song.index} title={song.title} signedIn={!!user}>
            {user && <LikeButton songId={song.id} initialLiked={likedMap[song.id] ?? false} initialCount={song._count?.likes ?? 0} size="md" />}
          </HymnActions>
        </div>

        {song.versions.length > 1 && (
          <div className="no-print flex flex-wrap justify-center gap-2 mb-6">
            {song.versions.map((x) => (
              <Link
                key={x.id}
                href={`/songs/${song.index}?v=${x.versionNumber}`}
                className={`px-3 py-1 rounded-[var(--radius-pill)] text-[12px] no-underline border-[0.5px] ${
                  x.id === version?.id ? "bg-forest text-parchment border-forest" : "bg-sand text-text-body border-transparent"
                }`}
              >
                v{x.versionNumber} · {t(`versionType.${x.versionType}`)}
              </Link>
            ))}
          </div>
        )}

        {version && (
          <div className="max-w-xl mx-auto">
            <LyricsView content={version.content} annotations={version.annotations} />
          </div>
        )}
      </div>

      {version && version.previews.length > 0 && (
        <section className="no-print mt-10">
          <SectionLabel>{t("listen")}</SectionLabel>
          <div className="flex flex-col gap-3">
            {version.previews.map((p) => (
              <div key={p.id} className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] p-3">
                <audio controls preload="none" className="w-full" src={p.fileUrl}>
                  {t("audioNotSupported")}
                </audio>
              </div>
            ))}
          </div>
        </section>
      )}

      {song.notes.length > 0 && (
        <section className="no-print mt-10">
          <SectionLabel>{t("notes")}</SectionLabel>
          <div className="space-y-3">
            {song.notes.map((note) => (
              <p key={note.id} className="m-0 bg-linen rounded-[var(--radius-md)] px-4 py-3 border-l-2 border-l-stone text-[14px] text-text-body leading-relaxed">
                {note.content}
              </p>
            ))}
          </div>
        </section>
      )}

      {(song.tags.length > 0 || song.languages.length > 0) && (
        <div className="no-print mt-10 flex flex-wrap justify-center gap-1.5">
          {song.languages.map((l) => (
            <Tag key={l.code} label={getTranslatedName(l.name, locale)} />
          ))}
          {song.tags.map((tag) => (
            <Tag
              key={tag.id}
              label={getTranslatedName(tag.name, locale)}
              variant={tag.category === "MOOD" ? "mood" : "keyword"}
              href={tag.key ? `/songs?tag=${encodeURIComponent(tag.key)}` : undefined}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <HymnPager prev={adjacent.prev} next={adjacent.next} />
      </div>
    </article>
  );
}
