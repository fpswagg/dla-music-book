/**
 * One-off after the "refonte" migration (safe to re-run):
 *  - SongVersion.content ← parsed from SongVersion.lyrics where missing,
 *  - SongVersion.lyrics  ← normalised text format,
 *  - Song.searchText     ← recomputed for every hymn.
 *
 * pnpm db:backfill            # dry run: prints what would change
 * pnpm db:backfill --apply    # writes
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { getLyricsContent, parseLyrics, plainLyrics, serializeLyrics } from "../../src/lib/lyrics";
import { buildSearchText } from "../../src/lib/duala";

const apply = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const versions = await prisma.songVersion.findMany({
    where: { content: { equals: Prisma.DbNull } },
    select: { id: true, lyrics: true },
  });
  console.log(`${versions.length} version(s) without structured lyrics`);
  for (const v of versions) {
    const content = parseLyrics(v.lyrics);
    if (apply) {
      await prisma.songVersion.update({
        where: { id: v.id },
        data: { content: content as unknown as object, lyrics: serializeLyrics(content) },
      });
    }
  }

  const songs = await prisma.song.findMany({
    select: {
      id: true,
      title: true,
      tune: true,
      searchText: true,
      versions: { select: { content: true, lyrics: true } },
      references: { select: { number: true, hymnal: { select: { code: true } } } },
      songAuthors: { select: { author: { select: { name: true } } } },
    },
  });
  let changed = 0;
  for (const s of songs) {
    const searchText = buildSearchText([
      s.title,
      s.tune,
      ...s.versions.map((v) => plainLyrics(getLyricsContent(v))),
      ...s.references.map((r) => `${r.hymnal.code} ${r.number}`),
      ...s.songAuthors.map((a) => a.author.name),
    ]);
    if (searchText !== s.searchText) {
      changed++;
      if (apply) await prisma.song.update({ where: { id: s.id }, data: { searchText } });
    }
  }
  console.log(`${changed} song(s) with a new searchText`);
  console.log(apply ? "Done." : "Dry run — add --apply to write.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
