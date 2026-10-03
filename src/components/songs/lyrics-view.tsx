"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnnotationBlock } from "@/components/ui/annotation-block";
import { normalizeForSearch } from "@/lib/duala";
import { displayBlocks, type DisplayLine, type LyricsContent } from "@/lib/lyrics";

type Annotation = { id?: string; lineNumber: number; lineText: string; note: string };

/** Hymn lyrics laid out like the book: hanging stanza numbers, indented refrain. */
export function LyricsView({
  content,
  annotations = [],
  stanzas,
  className = "",
}: {
  content: LyricsContent;
  annotations?: Annotation[];
  /** Only these stanzas (service programmes). */
  stanzas?: number[];
  className?: string;
}) {
  const t = useTranslations("song");
  const [showNotes, setShowNotes] = useState(false);
  const blocks = useMemo(() => displayBlocks(content, { stanzas }), [content, stanzas]);

  // Annotations match the line text first (robust to edits), then the line number.
  const noteFor = useMemo(() => {
    const byText = new Map(annotations.map((a) => [normalizeForSearch(a.lineText), a]));
    const byNumber = new Map(annotations.map((a) => [a.lineNumber, a]));
    return (line: DisplayLine) =>
      line.number === null ? undefined : (byText.get(normalizeForSearch(line.text)) ?? byNumber.get(line.number));
  }, [annotations]);

  if (!blocks.length) {
    return <p className="text-[14px] text-text-muted m-0">{t("noLyrics")}</p>;
  }

  const renderLine = (line: DisplayLine, i: number) => {
    const note = annotations.length ? noteFor(line) : undefined;
    return (
      <div key={i}>
        <div className={note ? "bg-amber-light -mx-2 px-2 rounded-[var(--radius-sm)] border-l-2 border-l-amber" : undefined}>
          {line.text}
        </div>
        {note && showNotes && (
          <div className="my-2 font-ui text-[13px] overflow-hidden animate-[slideDown_200ms_ease-out]">
            <AnnotationBlock lineText={note.lineText} note={note.note} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {annotations.length > 0 && (
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          aria-pressed={showNotes}
          className={`no-print mb-5 min-h-[40px] px-4 py-2 rounded-[var(--radius-pill)] text-[12px] font-medium font-ui border-[0.5px] cursor-pointer transition-colors ${
            showNotes ? "bg-amber-light text-amber border-amber" : "bg-transparent text-amber border-stone"
          }`}
        >
          {showNotes ? t("hideAnnotations") : t("showAnnotations", { count: annotations.length })}
        </button>
      )}

      <div className="lyrics flex flex-col gap-[0.9em]">
        {blocks.map((b) => {
          if (b.kind === "stanza") {
            return (
              <div key={b.key} className="lyrics-block lyrics-stanza">
                <span className="lyrics-stanza-number" aria-hidden>
                  {b.number}.
                </span>
                <span className="sr-only">{t("stanzaN", { n: b.number ?? 0 })}</span>
                {b.lines.map(renderLine)}
              </div>
            );
          }
          if (b.kind === "refrain") {
            return (
              <div key={b.key} className={`lyrics-block lyrics-refrain ${b.repeat ? "refrain-repeat" : ""}`}>
                <div className="lyrics-refrain-label">{t("refrain")}</div>
                <div className="refrain-full">{b.lines.map(renderLine)}</div>
                {b.repeat && (
                  <div className="refrain-short text-green-muted">{b.lines[0]?.text.replace(/[,;:!.\s]+$/, "")}…</div>
                )}
              </div>
            );
          }
          return (
            <div key={b.key} className="lyrics-block">
              {b.lines.map(renderLine)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
