/**
 * Help for finding a score: read the tune field as printed in the book ("Nun danket alle Gott. W. 158",
 * "S. S. et S. 391"), split the melody name from hymnal references, and build search links to
 * public-domain sources. Those sites block automated requests, so the admin opens the links,
 * downloads the file and imports it; nothing is fetched or imported without a person checking it.
 */

export type TuneRef = { abbr: string; number: string };
export type CleanTune = { name: string | null; refs: TuneRef[]; ownMelody: boolean };

// Hymnal abbreviations: initials ("W.", "K.M.", "S. S. et S.") or the few short words used in the book.
const REF = /((?:(?:Singv[ôo]g|Singv|Chr|Ch|Mt|[A-ZÄÖÜ])[.,]\s*){1,3}(?:et\s+S[.,]+\s*)?)(\d+[a-z]?|I{1,3}(?![a-z]))(?![\w'])[.,:]?/g;
const OWN = /^(eigene\s+melodie|own\s+tune|mélodie\s+propre)$/i;

const tidy = (s: string) =>
  s
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,:;|–-]+|[\s.,:;|–-]+$/g, "")
    .replace(/\.\.\.$/, "")
    .trim();

export function cleanTuneField(raw: string | null | undefined): CleanTune {
  const refs: TuneRef[] = [];
  const names: string[] = [];
  for (const part of (raw ?? "").split("|")) {
    const rest = part.replace(REF, (_m, abbr: string, num: string) => {
      refs.push({ abbr: abbr.replace(/\s+/g, " ").replace(/[,\s]+$/, "").trim(), number: num });
      return " ";
    });
    const name = tidy(rest);
    // A leftover like "all" or "S.o" is not a melody name.
    if (name.length >= 4 && /[a-zäöüß]{3}/i.test(name)) names.push(name);
  }
  const name = names.sort((a, b) => b.length - a.length)[0] ?? null;
  return { name: name && OWN.test(name) ? null : name, refs, ownMelody: !!name && OWN.test(name) };
}

/** Normalised key for grouping hymns sung to the same melody. */
export function tuneKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type SourceLink = { source: "hymnary" | "cpdl" | "openhymnal" | "imslp"; label: string; url: string };

const q = encodeURIComponent;

/** Search pages for a melody name and/or a first line (English or German original). */
export function sourceLinks(query: string): SourceLink[] {
  const text = query.trim();
  if (!text) return [];
  return [
    { source: "hymnary", label: "Hymnary.org — tunes", url: `https://hymnary.org/search?qu=${q(`tuneName:"${text}" in:tunes`)}` },
    { source: "hymnary", label: "Hymnary.org — texts", url: `https://hymnary.org/search?qu=${q(text)}` },
    { source: "cpdl", label: "CPDL (ChoralWiki)", url: `https://www.cpdl.org/wiki/index.php?search=${q(text)}` },
    { source: "openhymnal", label: "Open Hymnal", url: `https://duckduckgo.com/?q=${q(`site:openhymnal.org ${text}`)}` },
    { source: "imslp", label: "IMSLP", url: `https://imslp.org/index.php?search=${q(text)}` },
  ];
}
