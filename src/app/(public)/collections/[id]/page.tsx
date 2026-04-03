import { notFound } from "next/navigation";
import Link from "next/link";
import { isMockMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMockCollections, getMockSongById } from "@/lib/mock/provider";
import { SongCard } from "@/components/ui/song-card";
import { SectionLabel } from "@/components/ui/section-label";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("common");

  let collection: { name: string; description: string | null; songs: CollectionSong[] } | null = null;

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
        tags: s.tags,
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
      name: col.name,
      description: col.description,
      songs: col.collectionSongs.map((cs) => ({
        id: cs.song.id,
        index: cs.song.index,
        title: cs.song.title,
        status: cs.song.status,
        authors: cs.song.songAuthors.map((sa) => ({ name: sa.author.name })),
        tags: cs.song.songTags.map((st) => ({ name: st.tag.name, category: st.tag.category })),
      })),
    };
  }

  if (!collection) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-1">
        {collection.name}
      </h1>
      {collection.description && (
        <p className="text-[14px] text-[var(--color-green-muted)] font-[var(--font-ui)] mb-6">
          {collection.description}
        </p>
      )}
      <SectionLabel>{collection.songs.length} {t("songs")}</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collection.songs.map((song) => (
          <Link key={song.id} href={`/songs/${song.id}`} className="no-underline">
            <SongCard
              index={song.index}
              title={song.title}
              meta={song.authors.map((a) => a.name).join(", ")}
              status={song.status.toLowerCase() as "finished" | "draft"}
              tags={song.tags.map((t) => ({ name: t.name, isMood: t.category === "MOOD" }))}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
