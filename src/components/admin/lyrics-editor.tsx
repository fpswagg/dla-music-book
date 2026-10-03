"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DualaKeyboard } from "@/components/ui/duala-keyboard";
import { LyricsView } from "@/components/songs/lyrics-view";
import { parseLyrics } from "@/lib/lyrics";

/** Text-format lyrics with a live, book-like preview. */
export function LyricsEditor({
  value,
  onChange,
  refrainAfterEach,
  onRefrainAfterEachChange,
  rows = 16,
}: {
  value: string;
  onChange: (v: string) => void;
  refrainAfterEach?: boolean;
  onRefrainAfterEachChange?: (v: boolean) => void;
  rows?: number;
}) {
  const t = useTranslations("lyricsEditor");
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const parsed = useMemo(() => {
    const c = parseLyrics(value);
    if (refrainAfterEach !== undefined && c.blocks.some((b) => b.kind === "refrain")) c.refrainAfterEachStanza = refrainAfterEach;
    return c;
  }, [value, refrainAfterEach]);
  const hasRefrain = parsed.blocks.some((b) => b.kind === "refrain");
  const stanzaCount = parsed.blocks.filter((b) => b.kind === "stanza").length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DualaKeyboard target={ref} onChange={onChange} />
          <button type="button" onClick={() => setShowHelp((v) => !v)} className="bg-transparent border-none text-[12px] text-forest cursor-pointer">
            {t("formatHelp")}
          </button>
        </div>
        {showHelp && (
          <div className="text-[12px] text-text-body bg-amber-light rounded-[var(--radius-md)] p-3 leading-relaxed">
            <p className="m-0 mb-1">{t("help1")}</p>
            <p className="m-0 mb-1">{t("help2")}</p>
            <p className="m-0">{t("help3")}</p>
          </div>
        )}
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          spellCheck={false}
          placeholder={"1. …\n…\n\nR. …\n\n2. …"}
          className="w-full bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3.5 py-2.5 text-[15px] leading-relaxed text-deep font-display outline-none resize-y focus:border-forest focus:bg-parchment"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-muted">
          <span>{t("summary", { stanzas: stanzaCount, refrain: hasRefrain ? 1 : 0 })}</span>
          {hasRefrain && onRefrainAfterEachChange && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-text-body">
              <input type="checkbox" checked={refrainAfterEach ?? parsed.refrainAfterEachStanza} onChange={(e) => onRefrainAfterEachChange(e.target.checked)} />
              {t("refrainAfterEach")}
            </label>
          )}
        </div>
      </div>
      <div className="min-w-0 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-md)] p-4 max-h-[70vh] overflow-auto">
        <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted m-0 mb-3">{t("preview")}</p>
        <LyricsView content={parsed} />
      </div>
    </div>
  );
}
