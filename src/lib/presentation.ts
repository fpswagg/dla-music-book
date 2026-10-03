import { displayBlocks, type LyricsContent } from "./lyrics";

/** One screen of the projection mode. */
export type Slide = {
  key: string;
  kind: "title" | "stanza" | "refrain" | "text" | "label";
  /** Small line above the text ("42 · 2/4", "Refrain", "Offrande"). */
  kicker: string;
  lines: string[];
  /** Hymn number the slide belongs to (for the "go to" jump). */
  hymn?: number;
};

export type SlideLabels = { refrain: string; stanza: (n: number, total: number) => string };

export function hymnSlides(
  song: { index: number; title: string; references: Array<{ code: string; number: string }>; content: LyricsContent },
  labels: SlideLabels,
  opts: { stanzas?: number[]; label?: string | null; titleSlide?: boolean } = {},
): Slide[] {
  const blocks = displayBlocks(song.content, { stanzas: opts.stanzas });
  const total = song.content.blocks.filter((b) => b.kind === "stanza").length;
  const slides: Slide[] = [];
  if (opts.titleSlide !== false) {
    slides.push({
      key: `${song.index}-title`,
      kind: "title",
      kicker: [opts.label, song.references.map((r) => `${r.code} ${r.number}`).join(" – ")].filter(Boolean).join(" · "),
      lines: [String(song.index), song.title],
      hymn: song.index,
    });
  }
  for (const b of blocks) {
    slides.push({
      key: `${song.index}-${b.key}`,
      kind: b.kind,
      kicker:
        b.kind === "stanza"
          ? `${song.index} · ${labels.stanza(b.number ?? 0, total)}`
          : b.kind === "refrain"
            ? `${song.index} · ${labels.refrain}`
            : `${song.index}`,
      lines: b.lines.map((l) => l.text),
      hymn: song.index,
    });
  }
  return slides;
}
