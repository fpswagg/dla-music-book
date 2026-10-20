import { normalizeForSearch } from "@/lib/duala";
import { displayBlocks, type LyricsContent } from "@/lib/lyrics";

/** A transcribed word with its time in seconds. */
export type Word = { w: string; start: number; end: number };
export type AlignedLine = { line: number; text: string; startMs: number; endMs: number };
export type SongMatch = { songId: string; index: number; title: string; score: number };

/** Lyric lines in singing order (refrains repeated), the unit of karaoke timing. */
export function sungLines(content: LyricsContent): string[] {
  return displayBlocks(content).flatMap((b) => b.lines.map((l) => l.text));
}

export const tokens = (s: string) => normalizeForSearch(s).split(" ").filter(Boolean);

function trigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of tokens(s)) {
    const p = ` ${w} `;
    for (let i = 0; i + 3 <= p.length; i++) out.add(p.slice(i, i + 3));
  }
  return out;
}

/**
 * Hymns whose text contains what was heard. Score = share of the transcription's trigrams found in
 * the hymn (robust to misheard words and to recordings of a few stanzas only).
 */
export function rankSongs(text: string, songs: Array<{ id: string; index: number; title: string; searchText: string }>, limit = 5): SongMatch[] {
  const heard = trigrams(text);
  if (heard.size < 8) return [];
  return songs
    .map((s) => {
      const own = trigrams(s.searchText);
      let hit = 0;
      for (const g of heard) if (own.has(g)) hit++;
      return { songId: s.id, index: s.index, title: s.title, score: Math.round((hit / heard.size) * 1000) / 1000 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** 0..1 similarity of two normalised words (Levenshtein). */
export function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

/**
 * Karaoke timing: aligns the lyric words with the transcribed words (dynamic programming, cheap
 * to skip lyric words so unsung stanzas are allowed) and gives each sung line its start and end.
 * Lines with too few recognised words are left out; the editor lets a human fill them in.
 */
export function alignLines(lines: string[], words: Word[], minShare = 0.34): AlignedLine[] {
  const lyric: Array<{ t: string; line: number }> = [];
  lines.forEach((text, line) => tokens(text).forEach((t) => lyric.push({ t, line })));
  const heard = words.flatMap((w) => tokens(w.w).map((t) => ({ t, start: w.start, end: w.end })));
  const L = lyric.length;
  const H = heard.length;
  if (!L || !H) return [];

  const SKIP_LYRIC = -0.15;
  const SKIP_HEARD = -0.5;
  const score = new Float64Array((L + 1) * (H + 1));
  const move = new Uint8Array((L + 1) * (H + 1)); // 1 diag, 2 skip lyric, 3 skip heard
  const at = (i: number, j: number) => i * (H + 1) + j;
  for (let i = 1; i <= L; i++) {
    score[at(i, 0)] = i * SKIP_LYRIC;
    move[at(i, 0)] = 2;
  }
  for (let j = 1; j <= H; j++) {
    score[at(0, j)] = j * SKIP_HEARD;
    move[at(0, j)] = 3;
  }
  for (let i = 1; i <= L; i++) {
    for (let j = 1; j <= H; j++) {
      const sim = wordSimilarity(lyric[i - 1].t, heard[j - 1].t);
      const diag = score[at(i - 1, j - 1)] + (sim >= 0.5 ? 2 * sim : -1);
      const up = score[at(i - 1, j)] + SKIP_LYRIC;
      const left = score[at(i, j - 1)] + SKIP_HEARD;
      const best = diag >= up && diag >= left ? 1 : up >= left ? 2 : 3;
      score[at(i, j)] = best === 1 ? diag : best === 2 ? up : left;
      move[at(i, j)] = best;
    }
  }

  const hits = new Map<number, Array<{ start: number; end: number }>>();
  let i = L;
  let j = H;
  while (i > 0 || j > 0) {
    const m = move[at(i, j)];
    if (m === 1) {
      if (wordSimilarity(lyric[i - 1].t, heard[j - 1].t) >= 0.5) {
        const arr = hits.get(lyric[i - 1].line) ?? [];
        arr.push(heard[j - 1]);
        hits.set(lyric[i - 1].line, arr);
      }
      i--;
      j--;
    } else if (m === 2) i--;
    else j--;
  }

  const out: AlignedLine[] = [];
  lines.forEach((text, line) => {
    const h = hits.get(line);
    const n = tokens(text).length;
    if (!h || !n || h.length / n < minShare) return;
    out.push({
      line,
      text,
      startMs: Math.round(Math.min(...h.map((x) => x.start)) * 1000),
      endMs: Math.round(Math.max(...h.map((x) => x.end)) * 1000),
    });
  });
  // A line ends at the latest when the next one starts.
  for (let k = 0; k + 1 < out.length; k++) out[k].endMs = Math.min(out[k].endMs, out[k + 1].startMs);
  return out;
}
