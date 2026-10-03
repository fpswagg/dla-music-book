import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { buildSearchText } from "./duala";
import { getLyricsContent, parseLyrics, plainLyrics, serializeLyrics, type LyricsContent } from "./lyrics";
import { prisma } from "./prisma";

type Tx = Prisma.TransactionClient;

/** Text-format lyrics → stored pair { content, lyrics }. */
export function lyricsFromText(text: string, refrainAfterEachStanza?: boolean): { content: LyricsContent; lyrics: string } {
  const content = parseLyrics(text);
  if (refrainAfterEachStanza !== undefined && content.blocks.some((b) => b.kind === "refrain")) {
    content.refrainAfterEachStanza = refrainAfterEachStanza;
  }
  return { content, lyrics: serializeLyrics(content) };
}

export function contentJson(content: LyricsContent): Prisma.InputJsonValue {
  return content as unknown as Prisma.InputJsonValue;
}

/** Recompute Song.searchText (title, tune, all versions, references, authors). */
export async function refreshSearchText(songId: string, tx: Tx | NonNullable<typeof prisma> = prisma!): Promise<void> {
  const song = await tx.song.findUnique({
    where: { id: songId },
    select: {
      title: true,
      tune: true,
      versions: { select: { content: true, lyrics: true } },
      references: { select: { number: true, hymnal: { select: { code: true } } } },
      songAuthors: { select: { author: { select: { name: true } } } },
    },
  });
  if (!song) return;
  const searchText = buildSearchText([
    song.title,
    song.tune,
    ...song.versions.map((v) => plainLyrics(getLyricsContent(v))),
    ...song.references.map((r) => `${r.hymnal.code} ${r.number}`),
    ...song.songAuthors.map((sa) => sa.author.name),
  ]);
  await tx.song.update({ where: { id: songId }, data: { searchText } });
}

export async function replaceReferences(
  tx: Tx,
  songId: string,
  references: Array<{ hymnalId: string; number: string }>,
): Promise<void> {
  await tx.songReference.deleteMany({ where: { songId } });
  const seen = new Set<string>();
  let order = 0;
  for (const r of references) {
    const key = `${r.hymnalId}:${r.number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await tx.songReference.create({ data: { songId, hymnalId: r.hymnalId, number: r.number, displayOrder: order++ } });
  }
}
