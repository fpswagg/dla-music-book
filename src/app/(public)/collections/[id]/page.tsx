import { notFound } from "next/navigation";
import Link from "next/link";
import { isMockMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMockCollections, getMockSongById } from "@/lib/mock/provider";
import { SongCard } from "@/components/ui/song-card";
import { SectionLabel } from "@/components/ui/section-label";
import { getTranslations, getLocale } from "next-intl/server";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { BackLink } from "@/components/ui/back-link";

type Props = { params: Promise<{ id: string }> };

type CollectionSong = {
  id: string;
  index: number;
  title: string;
  status: string;
  authors: Array<{ name: string }>;
  tags: Array<{ name: string; category?: string }>;
};

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const [t, tc] = await Promise.all([
    getTranslations("common"),
    getTranslations("collections"),
  ]);
  const locale = await getLocale();

  let collection: { name: Record<string, string> | string; description: Record<string, string> | string | null; songs: CollectionSong[] } | null = null;

  if (isMockMode()) {
    const mock = getMockCollections().find((c) => c.id === id);
    if (!mock) notFound();
    const songs: CollectionSong[] = [];
    for (const sId of mock.songs) {
      const s = getMockSongById(sId);
      if (!s) continue;
      songs.push({
        id: s.id,
        index: s.index,
        title: s.title,
        status: s.status,
        authors: s.authors,
        tags: s.tags.map((tag) => ({
          name: getTranslatedName(tag.name, locale),
          category: tag.category,
        })),
      });
    }
    collection = {
      name: mock.name,
      description: mock.description,
      songs,
    };
  } else if (prisma) {
    const col = await prisma.collection.findUnique({
      where: { id, status: "PUBLIC" },
      include: {
        collectionSongs: {
          include: {
            song: {
              include: {
                songAuthors: { include: { author: true }, orderBy: { displayOrder: "asc" } },
                songTags: { include: { tag: true } },
              },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
    if (!col) notFound();
    collection = {
      name: col.name as Record<string, string>,
      description: col.description as Record<string, string> | null,
      songs: col.collectionSongs.map((cs) => ({
        id: cs.song.id,
        index: cs.song.index,
        title: cs.song.title,
        status: cs.song.status,
        authors: cs.song.songAuthors.map((sa) => ({ name: sa.author.name })),
        tags: cs.song.songTags.map((st) => ({
          name: getTranslatedName(st.tag.name as Record<string, string>, locale),
          category: st.tag.category,
        })),
      })),
    };
  }

  if (!collection) notFound();

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <BackLink href="/collections" label={tc("backToCollections")} />

      <h1 className="text-[24px] sm:text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-1 text-balance">
        {getTranslatedName(collection.name, locale)}
      </h1>
      {collection.description ? (
        <p className="text-[14px] text-[var(--color-green-muted)] font-[var(--font-ui)] mb-6">
          {getTranslatedName(collection.description, locale)}
        </p>
      ) : null}
      <SectionLabel>{collection.songs.length} {t("songs")}</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collection.songs.map((song) => (
          <Link key={song.id} href={`/songs/${song.id}`} className="no-underline">
            <SongCard
              songId={song.id}
              index={song.index}
              title={song.title}
              meta={song.authors.map((a) => a.name).join(", ")}
              tags={song.tags.map((tg) => ({ name: tg.name, isMood: tg.category === "MOOD" }))}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
