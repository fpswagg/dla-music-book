import "server-only";
import { prisma } from "./prisma";
import { cleanTuneField, sourceLinks, tuneKey, type SourceLink, type TuneRef } from "./music/tune-sources";

/**
 * Proposals for the admin, built from the tune names printed in the book:
 * hymns sharing a melody are grouped, matched to an existing Tune when the name is the same,
 * and come with search links to public-domain sources. The admin validates each proposal.
 */

export type TuneProposal = {
  key: string;
  name: string;
  songs: Array<{ id: string; index: number; title: string; tune: string | null; tuneId: string | null }>;
  refs: TuneRef[];
  existingTune: { id: string; name: string } | null;
  links: SourceLink[];
};

/** Well-known collections, for the search query only. */
const KNOWN_HYMNALS: Record<string, string> = { "S. S. et S.": "Sacred Songs and Solos" };

const normAbbr = (s: string) => s.replace(/[\s.,]/g, "").toLowerCase();

export function refQuery(ref: TuneRef): string | null {
  const known = Object.entries(KNOWN_HYMNALS).find(([abbr]) => normAbbr(abbr) === normAbbr(ref.abbr));
  return known ? `${known[1]} ${ref.number}` : null;
}

export async function getTuneProposals(): Promise<TuneProposal[]> {
  if (!prisma) return [];
  const [songs, tunes] = await Promise.all([
    prisma.song.findMany({
      where: { tune: { not: null } },
      select: { id: true, index: true, title: true, tune: true, tuneId: true },
      orderBy: { index: "asc" },
    }),
    prisma.tune.findMany({ select: { id: true, name: true } }),
  ]);
  const tuneByKey = new Map(tunes.map((t) => [tuneKey(t.name), t]));
  const groups = new Map<string, TuneProposal>();
  for (const song of songs) {
    const clean = cleanTuneField(song.tune);
    if (!clean.name) continue;
    const key = tuneKey(clean.name);
    const g = groups.get(key) ?? {
      key,
      name: clean.name,
      songs: [],
      refs: [],
      existingTune: tuneByKey.get(key) ?? null,
      links: sourceLinks(clean.name),
    };
    g.songs.push(song);
    for (const r of clean.refs) if (!g.refs.some((x) => x.abbr === r.abbr && x.number === r.number)) g.refs.push(r);
    // Prefer the longest spelling as the display name ("Nun danket alle Gott" over "Nun danket all").
    if (clean.name.length > g.name.length) g.name = clean.name;
    groups.set(key, g);
  }
  // Only what still needs a decision: some hymn of the group is not linked to a tune yet.
  return [...groups.values()]
    .filter((g) => g.songs.some((s) => !s.tuneId))
    .sort((a, b) => b.songs.length - a.songs.length || a.name.localeCompare(b.name));
}

/** Search help for one hymn (its tune field, hymnal references, links). */
export async function getSongTuneHelp(songId: string) {
  if (!prisma) return null;
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true, index: true, title: true, tune: true, tuneId: true } });
  if (!song) return null;
  const clean = cleanTuneField(song.tune);
  const queries = [clean.name, ...clean.refs.map(refQuery)].filter((x): x is string => !!x);
  const tunes = clean.name
    ? (await prisma.tune.findMany({ select: { id: true, name: true } })).filter((t) => tuneKey(t.name) === tuneKey(clean.name!))
    : [];
  return { song, clean, matches: tunes, links: queries.flatMap((q) => sourceLinks(q).map((l) => ({ ...l, query: q }))) };
}
