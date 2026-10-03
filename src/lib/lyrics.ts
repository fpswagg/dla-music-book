import { normalizeForSearch } from "./duala";

/**
 * Structured lyrics, modelled on the printed hymnal: numbered stanzas, a refrain written once
 * (then abbreviated "Ba longo…" after later stanzas), and free text (e.g. a heading).
 *
 * Text format (used by the editor, the bulk import and SongVersion.lyrics):
 *
 *   1. Loba le bwam! moń na wase,
 *   minja, midongo na mindi,
 *
 *   R. Ba longo, ba longo…
 *
 *   2. Bińo longo la moń pe ya!
 *
 * Blocks are separated by blank lines; "N." starts stanza N (also mid-paragraph, as OCR often
 * drops blank lines); "R." / "Refrain:" starts the refrain.
 */

export type StanzaBlock = { kind: "stanza"; number: number; lines: string[] };
export type RefrainBlock = { kind: "refrain"; lines: string[] };
export type TextBlock = { kind: "text"; lines: string[] };
export type LyricsBlock = StanzaBlock | RefrainBlock | TextBlock;

export type LyricsContent = {
  version: 1;
  blocks: LyricsBlock[];
  /** Sing the refrain after every stanza (the book prints it once, then abbreviates it). */
  refrainAfterEachStanza: boolean;
};

const STANZA_RE = /^\s*(\d{1,2})\s*[.)]\s+(.*)$/;
const REFRAIN_INLINE_RE = /^\s*(?:R|Réf|Ref|Refr|Refrain|Chorus|Ch(?:œ|oe)ur)\s*[.:)]\s*(.*)$/i;
const REFRAIN_HEADER_RE = /^\s*(?:refrain|réfrain|chorus|ch(?:œ|oe)ur)\s*:?\s*$/i;
const ABBREVIATION_RE = /^(.{2,60}?)\s*(?:\.\.\.|…)\s*$/;

export const emptyLyrics = (): LyricsContent => ({ version: 1, blocks: [], refrainAfterEachStanza: false });

function cleanLines(lines: string[]): string[] {
  return lines.map((l) => l.replace(/\s+$/g, "")).filter((l) => l.trim() !== "");
}

/** Parse the text format into blocks. Tolerant: never throws. */
export function parseLyrics(text: string): LyricsContent {
  const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
  type Draft = { kind: LyricsBlock["kind"]; number?: number; lines: string[] };
  const drafts: Draft[] = [];
  let current: Draft | null = null;
  let sawMarker = false;

  const flush = () => {
    if (current && cleanLines(current.lines).length) drafts.push({ ...current, lines: cleanLines(current.lines) });
    current = null;
  };

  for (const raw of rawLines) {
    const line = raw.replace(/\s+$/g, "");
    if (line.trim() === "") {
      flush();
      continue;
    }
    const stanza = STANZA_RE.exec(line);
    if (stanza) {
      flush();
      sawMarker = true;
      current = { kind: "stanza", number: Number(stanza[1]), lines: [stanza[2]] };
      continue;
    }
    if (REFRAIN_HEADER_RE.test(line)) {
      flush();
      sawMarker = true;
      current = { kind: "refrain", lines: [] };
      continue;
    }
    const refrain = REFRAIN_INLINE_RE.exec(line);
    if (refrain) {
      flush();
      sawMarker = true;
      current = { kind: "refrain", lines: refrain[1] ? [refrain[1]] : [] };
      continue;
    }
    current ??= { kind: "text", lines: [] };
    current.lines.push(line.trim());
  }
  flush();

  // No markers at all: plain paragraphs are the stanzas, in order.
  let n = 0;
  const blocks: LyricsBlock[] = drafts.map((d) => {
    if (!sawMarker && d.kind === "text") return { kind: "stanza", number: ++n, lines: d.lines };
    if (d.kind === "stanza") return { kind: "stanza", number: d.number ?? ++n, lines: d.lines };
    if (d.kind === "refrain") return { kind: "refrain", lines: d.lines };
    return { kind: "text", lines: d.lines };
  });

  return resolveRefrainAbbreviations({ version: 1, blocks, refrainAfterEachStanza: blocks.some((b) => b.kind === "refrain") });
}

const startsLike = (line: string, abbr: string) => {
  const a = normalizeForSearch(abbr);
  return a.length > 0 && normalizeForSearch(line).startsWith(a);
};

/**
 * "Ba longo…" at the end of a stanza means "sing the refrain here". Remove those lines and,
 * when the refrain was not marked, cut it out of the stanza where it is written in full.
 */
export function resolveRefrainAbbreviations(content: LyricsContent): LyricsContent {
  const blocks = content.blocks.map((b) => ({ ...b, lines: [...b.lines] })) as LyricsBlock[];
  const abbreviations: string[] = [];
  for (const b of blocks) {
    if (b.kind !== "stanza" || b.lines.length < 2) continue;
    const m = ABBREVIATION_RE.exec(b.lines[b.lines.length - 1].trim());
    if (m && m[1].split(/\s+/).length <= 6) abbreviations.push(m[1]);
  }
  if (!abbreviations.length) return { ...content, blocks };

  const abbr = abbreviations[0];
  let refrain = blocks.find((b): b is RefrainBlock => b.kind === "refrain");
  if (!refrain) {
    for (let i = 0; i < blocks.length && !refrain; i++) {
      const b = blocks[i];
      if (b.kind !== "stanza") continue;
      const at = b.lines.findIndex((l, j) => j > 0 && startsLike(l, abbr) && !ABBREVIATION_RE.test(l.trim()));
      if (at > 0) {
        refrain = { kind: "refrain", lines: b.lines.slice(at) };
        b.lines = b.lines.slice(0, at);
        blocks.splice(i + 1, 0, refrain);
      }
    }
  }
  if (!refrain) return { ...content, blocks };

  const first = refrain.lines[0] ?? "";
  for (const b of blocks) {
    if (b.kind !== "stanza") continue;
    const last = b.lines[b.lines.length - 1]?.trim() ?? "";
    const m = ABBREVIATION_RE.exec(last);
    if (m && b.lines.length > 1 && startsLike(first, m[1])) b.lines.pop();
  }
  return { ...content, blocks, refrainAfterEachStanza: true };
}

/** Back to the text format (round-trips with parseLyrics). */
export function serializeLyrics(content: LyricsContent): string {
  return content.blocks
    .map((b) => {
      const [head = "", ...rest] = b.lines;
      if (b.kind === "stanza") return [`${b.number}. ${head}`, ...rest].join("\n");
      if (b.kind === "refrain") return [`R. ${head}`, ...rest].join("\n");
      return b.lines.join("\n");
    })
    .join("\n\n");
}

/** Every lyric line without markers (search, previews, meta descriptions). */
export function plainLyrics(content: LyricsContent): string {
  return content.blocks.map((b) => b.lines.join("\n")).join("\n\n");
}

export function firstLine(content: LyricsContent): string {
  const b = content.blocks.find((x) => x.kind === "stanza") ?? content.blocks[0];
  return (b?.lines[0] ?? "").replace(/[,;:!.\s]+$/, "");
}

function isLyricsContent(v: unknown): v is LyricsContent {
  return !!v && typeof v === "object" && Array.isArray((v as LyricsContent).blocks);
}

/** Structured lyrics of a version: stored JSON when valid, else parsed from the text. */
export function getLyricsContent(version: { content?: unknown; lyrics: string }): LyricsContent {
  if (isLyricsContent(version.content)) {
    const c = version.content;
    return { version: 1, blocks: c.blocks, refrainAfterEachStanza: !!c.refrainAfterEachStanza };
  }
  return parseLyrics(version.lyrics ?? "");
}

export type DisplayLine = { text: string; number: number | null };
export type DisplayBlock = {
  key: string;
  kind: LyricsBlock["kind"];
  number?: number;
  lines: DisplayLine[];
  /** A repeated refrain (not where it is written). */
  repeat: boolean;
};

/**
 * Blocks in singing order. Repeated refrains are inserted after each stanza when
 * `refrainAfterEachStanza`; lines get a running number (used by annotations), repeats don't.
 * `stanzas` limits to the given stanza numbers (service programmes).
 */
export function displayBlocks(content: LyricsContent, opts: { stanzas?: number[] } = {}): DisplayBlock[] {
  const refrain = content.blocks.find((b): b is RefrainBlock => b.kind === "refrain");
  const only = opts.stanzas?.length ? new Set(opts.stanzas) : null;
  const out: DisplayBlock[] = [];
  let lineNo = 0;
  let refrainShown = false;

  const refrainCopy = (key: string): DisplayBlock => {
    const block: DisplayBlock = {
      key,
      kind: "refrain",
      lines: (refrain?.lines ?? []).map((text) => ({ text, number: null })),
      repeat: refrainShown,
    };
    refrainShown = true;
    return block;
  };

  content.blocks.forEach((b, i) => {
    const lines = b.lines.map((text) => ({ text, number: ++lineNo }));
    if (b.kind === "refrain") {
      if (only) return; // placed after the selected stanzas below
      out.push({ key: `b${i}`, kind: "refrain", lines, repeat: refrainShown });
      refrainShown = true;
      return;
    }
    if (b.kind === "text") {
      if (!only) out.push({ key: `b${i}`, kind: "text", lines, repeat: false });
      return;
    }
    if (only && !only.has(b.number)) return;
    out.push({ key: `b${i}`, kind: "stanza", number: b.number, lines, repeat: false });
    if (!refrain) return;
    if (only) {
      if (!refrainShown || content.refrainAfterEachStanza) out.push(refrainCopy(`r${i}`));
    } else if (content.refrainAfterEachStanza && refrainShown && content.blocks[i + 1]?.kind !== "refrain") {
      out.push(refrainCopy(`r${i}`));
    }
  });
  return out;
}

/** Stanza numbers of a hymn (programmes pick from these). */
export function stanzaNumbers(content: LyricsContent): number[] {
  return content.blocks.filter((b): b is StanzaBlock => b.kind === "stanza").map((b) => b.number);
}

/** Lyric lines with their annotation line number, for the admin annotation picker. */
export function numberedLines(content: LyricsContent): Array<{ number: number; text: string; block: string }> {
  const out: Array<{ number: number; text: string; block: string }> = [];
  let n = 0;
  for (const b of content.blocks) {
    const label = b.kind === "stanza" ? `${b.number}.` : b.kind === "refrain" ? "R." : "";
    for (const text of b.lines) out.push({ number: ++n, text, block: label });
  }
  return out;
}
