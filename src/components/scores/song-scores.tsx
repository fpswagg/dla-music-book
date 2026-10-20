"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PlayerScore } from "./score-player";

const ScorePlayer = dynamic(() => import("./score-player").then((m) => m.ScorePlayer), { ssr: false });

type Tune = { name: string; key: string | null; timeSignature: string | null; composer: string | null; source: string | null; license: string | null };
type Score = PlayerScore & { source: string | null; license: string | null; kind: string };

/** "Partition" section of a hymn page: the scores of its tune, opened on demand (Verovio is ~7 MB). */
export function SongScores({ tune, scores, title }: { tune: Tune; scores: Score[]; title: string }) {
  const t = useTranslations("score");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(scores[0]);
  const meta = [tune.composer, tune.key, tune.timeSignature].filter(Boolean).join(" · ");
  const credit = [current.source ?? tune.source, current.license ?? tune.license].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap mb-3 font-ui">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] text-deep font-display truncate">{tune.name}</div>
          {meta && <div className="text-[12px] text-text-muted">{meta}</div>}
        </div>
        {scores.length > 1 && (
          <select
            value={current.id}
            onChange={(e) => setCurrent(scores.find((s) => s.id === e.target.value) ?? scores[0])}
            className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-2 py-1 text-[13px]"
            aria-label={t("version")}
          >
            {scores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
                {s.status === "DRAFT" ? ` (${t("draft")})` : ""}
              </option>
            ))}
          </select>
        )}
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="px-4 py-2 rounded-[var(--radius-pill)] bg-forest text-parchment text-[13px] cursor-pointer">
            {t("open")}
          </button>
        )}
      </div>
      {current.status === "DRAFT" && <p className="text-[12px] text-text-muted font-ui mb-2">{t("draftNotice")}</p>}
      {open && <ScorePlayer key={current.id} score={current} title={title} />}
      {credit && <p className="mt-3 text-[11px] text-text-muted font-ui">{credit}</p>}
    </div>
  );
}
