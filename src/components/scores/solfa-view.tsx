"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { doPitchClass, solfaMeasures } from "@/lib/music/solfa";
import { pcName } from "@/lib/music/keys";
import type { ScoreModel } from "./score-model";

/** The score as tonic sol-fa: one column per bar, one row per voice, lyrics under the top voice. */
export function SolfaView({
  model,
  verse,
  currentMeasure,
  onSeekMeasure,
}: {
  model: ScoreModel;
  verse: number | null;
  currentMeasure: number;
  onSeekMeasure: (index: number) => void;
}) {
  const t = useTranslations("score");
  const names = t("noteNames").split(",");
  const doPc = doPitchClass(model.fifths, model.mode);
  const beatQ = 4 / model.meter.unit;

  const rows = useMemo(() => {
    const measures = model.measures.map((m) => ({ startQ: m.startQ, lengthQ: m.endQ - m.startQ }));
    const voices = model.voices.length ? model.voices : [{ key: "", label: null, index: 0 }];
    return voices.map((v) => {
      const notes = model.notes
        .filter((n) => !v.key || n.voices.includes(v.key))
        .map((n) => ({ startQ: n.startQ, durQ: n.endQ - n.startQ, pitch: n.pitch }));
      return { voice: v, cells: solfaMeasures(notes, measures, doPc, beatQ) };
    });
  }, [model, doPc, beatQ]);

  const lyrics = useMemo(() => {
    if (verse === null) return null;
    return model.measures.map((_, i) => {
      const seen = new Set<number>();
      return model.notes
        .filter((n) => n.measure === i && n.syl[verse] && !seen.has(n.startMs) && seen.add(n.startMs))
        .map((n) => n.syl[verse].text + (n.syl[verse].wordpos === "i" || n.syl[verse].wordpos === "m" ? "-" : ""))
        .join(" ");
    });
  }, [model, verse]);

  return (
    <div className="font-ui">
      <p className="text-[13px] text-text-body mb-3">
        {t("doh", { note: pcName(doPc, names) })} · {model.meter.count}/{model.meter.unit}
      </p>
      <div className="flex flex-wrap gap-y-4 font-mono text-[13px] leading-6">
        {model.measures.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSeekMeasure(i)}
            className={`text-left px-2 border-l border-stone cursor-pointer ${i === currentMeasure ? "bg-green-light/60" : "hover:bg-sand/60"}`}
            aria-label={t("measureN", { n: m.n })}
          >
            {rows.map((r) => (
              <div key={r.voice.key} className="whitespace-pre flex gap-2">
                {i === 0 && rows.length > 1 && <span className="text-text-muted w-3">{r.voice.label ?? r.voice.index + 1}</span>}
                <span className={r.voice.index === 0 ? "text-deep" : "text-text-body"}>{r.cells[i] || " "}</span>
              </div>
            ))}
            {lyrics && <div className="text-[11px] font-ui text-text-muted italic whitespace-pre">{lyrics[i] || " "}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
