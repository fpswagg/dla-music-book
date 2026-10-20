"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KaraokeAudio, type KaraokeLine } from "./karaoke-audio";
import { formatDuration } from "./recording-list";

export type SongRecording = {
  id: string;
  title: string | null;
  performer: string | null;
  fileUrl: string;
  durationMs: number | null;
  source: string;
  generator: string | null;
  status: string;
  alignment: KaraokeLine[];
};

/** Recordings of a hymn on its page: pick one, listen, follow the words. */
export function SongRecordings({ recordings }: { recordings: SongRecording[] }) {
  const t = useTranslations("recordings");
  const [id, setId] = useState(recordings[0]?.id);
  const rec = recordings.find((r) => r.id === id) ?? recordings[0];
  if (!rec) return null;
  const label = (r: SongRecording) => [r.title || t("recording"), r.performer, formatDuration(r.durationMs)].filter(Boolean).join(" · ");

  return (
    <div className="font-ui flex flex-col gap-2">
      {recordings.length > 1 && (
        <select
          value={rec.id}
          onChange={(e) => setId(e.target.value)}
          aria-label={t("choose")}
          className="self-start bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] text-deep"
        >
          {recordings.map((r) => (
            <option key={r.id} value={r.id}>
              {label(r)}
              {r.source === "AI" ? ` (${t("aiLabel")})` : r.source === "RENDER" ? ` (${t("renderLabel")})` : ""}
            </option>
          ))}
        </select>
      )}
      <div className="text-[12px] text-text-muted flex flex-wrap gap-2 items-center">
        {recordings.length === 1 && <span>{label(rec)}</span>}
        {rec.source === "AI" && (
          <span className="px-1.5 py-0.5 rounded bg-sand text-text-body text-[11px]">
            {t("aiLabel")}
            {rec.generator ? ` · ${rec.generator}` : ""}
          </span>
        )}
        {rec.source === "RENDER" && <span className="px-1.5 py-0.5 rounded bg-sand text-text-body text-[11px]">{t("renderLabel")}</span>}
        {rec.status !== "PUBLISHED" && <span className="text-[11px]">({t("draftVisible")})</span>}
      </div>
      <KaraokeAudio key={rec.id} src={rec.fileUrl} lines={rec.alignment} />
      {!rec.alignment.length && <p className="text-[12px] text-text-muted m-0">{t("noTiming")}</p>}
    </div>
  );
}
