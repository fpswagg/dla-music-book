import { firstLine, parseLyrics, type LyricsContent } from "./lyrics";
import { looksLikeReferences, parseReferences, type HymnalLike, type ParsedReference } from "./references";

/**
 * Bulk import of digitised (pasted / OCR) pages of the book.
 *
 *   5                         ← hymn number alone on its line (or "# 5")
 *   M.B.8. - Evang. S. 189    ← optional reference line
 *   1. Edube na Loba!         ← stanzas, refrain…
 *   …
 *   10                        ← a lone number NOT followed by a stanza = page number (bottom of page)
 *
 * "Page 12" / "p. 12" lines also set the page.
 */

export type ImportedHymn = {
  index: number;
  title: string;
  page: number | null;
  references: ParsedReference[];
  content: LyricsContent;
  /** Lines the parser could not place, shown as warnings. */
  warnings: string[];
};

const NUMBER_ONLY = /^\s*(?:#\s*)?(\d{1,4})\s*$/;
const EXPLICIT_HYMN = /^\s*#\s*(\d{1,4})\s*$/;
const PAGE_RE = /^\s*(?:page|p\.)\s*(\d{1,4})\s*$/i;
const STANZA_START = /^\s*1\s*[.)]\s+\S/;

export function parseBookText(text: string, hymnals: HymnalLike[] = []): ImportedHymn[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const nextNonEmpty = (from: number) => {
    for (let j = from; j < lines.length; j++) if (lines[j].trim()) return j;
    return -1;
  };

  type Draft = { index: number; refs: ParsedReference[]; body: string[]; page: number | null };
  const hymns: Draft[] = [];
  let current: Draft | null = null;
  let awaitingPage: Draft[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const page = PAGE_RE.exec(line);
    if (page) {
      awaitingPage.forEach((h) => (h.page ??= Number(page[1])));
      awaitingPage = [];
      continue;
    }

    const num = NUMBER_ONLY.exec(line);
    if (num) {
      const j = nextNonEmpty(i + 1);
      const next = j >= 0 ? lines[j] : "";
      const isRefs = !!next && looksLikeReferences(next, hymnals);
      const k = isRefs ? nextNonEmpty(j + 1) : j;
      const startsStanza = k >= 0 && STANZA_START.test(lines[k]);
      if (EXPLICIT_HYMN.test(line) || isRefs || startsStanza) {
        current = { index: Number(num[1]), refs: isRefs ? parseReferences(next, hymnals) : [], body: [], page: null };
        hymns.push(current);
        awaitingPage.push(current);
        if (isRefs) i = j;
        continue;
      }
      // Page number printed at the bottom: applies to hymns that started on that page.
      awaitingPage.forEach((h) => (h.page ??= Number(num[1])));
      awaitingPage = [];
      continue;
    }
    current?.body.push(line);
  }

  return hymns.map((h) => {
    const content = parseLyrics(h.body.join("\n"));
    const warnings: string[] = [];
    if (!content.blocks.length) warnings.push("empty");
    if (h.refs.some((r) => !r.hymnalId)) warnings.push("unknown-hymnal");
    const numbers = content.blocks.flatMap((b) => (b.kind === "stanza" ? [b.number] : []));
    if (numbers.some((n, i) => n !== i + 1)) warnings.push("stanza-order");
    return {
      index: h.index,
      title: firstLine(content) || `${h.index}`,
      page: h.page,
      references: h.refs,
      content,
      warnings,
    };
  });
}
