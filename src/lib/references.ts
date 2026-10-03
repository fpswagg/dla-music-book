import { normalizeForSearch } from "./duala";

/**
 * Cross-references printed under the hymn number, e.g. "M. B. 11. - S. S. et S. 621"
 * or "M.B.8. - Evang. S. 189": hymnal abbreviation + number, separated by dashes.
 */

export type HymnalLike = { id: string; code: string; aliases?: string[] };
export type ParsedReference = { code: string; number: string; hymnalId?: string };

/** "S. S. et S." → "ssets": spaces and dots ignored. */
export function hymnalKey(code: string): string {
  return normalizeForSearch(code).replace(/\s+/g, "");
}

export function findHymnal<T extends HymnalLike>(code: string, hymnals: T[]): T | undefined {
  const key = hymnalKey(code);
  if (!key) return undefined;
  return hymnals.find((h) => hymnalKey(h.code) === key || (h.aliases ?? []).some((a) => hymnalKey(a) === key));
}

const PART_RE = /^(.*?[A-Za-zÀ-ÿ.,])\s*\.?\s*(\d{1,4}[a-z]?)\s*\.?\s*$/;

/** Parse a reference line. Unknown abbreviations come back without hymnalId. */
export function parseReferences(line: string, hymnals: HymnalLike[] = []): ParsedReference[] {
  const out: ParsedReference[] = [];
  for (const raw of line.split(/\s+[-–—]\s+|\s*;\s*|\s*[–—]\s*/)) {
    const part = raw.trim();
    if (!part) continue;
    const m = PART_RE.exec(part);
    if (!m) continue;
    const code = m[1].trim().replace(/[,\s]+$/, "");
    const hymnal = findHymnal(code, hymnals);
    out.push({ code: hymnal?.code ?? code, number: m[2], hymnalId: hymnal?.id });
  }
  return out;
}

/** Does this line look like a reference line (rather than lyrics)? */
export function looksLikeReferences(line: string, hymnals: HymnalLike[] = []): boolean {
  const refs = parseReferences(line, hymnals);
  if (!refs.length) return false;
  if (refs.some((r) => r.hymnalId)) return true;
  // Unknown hymnals: short dotted abbreviations followed by a number ("W. 12").
  return refs.every((r) => /^[A-ZÀ-Ý][\w.\s&]{0,20}$/.test(r.code) && r.code.includes("."));
}

export function formatReferences(refs: Array<{ code: string; number: string }>): string {
  return refs.map((r) => `${r.code} ${r.number}`).join(" – ");
}
