"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

export type RecordingItem = {
  id: string;
  title: string | null;
  performer: string | null;
  fileName: string | null;
  fileUrl: string | null;
  durationMs: number | null;
  source: string;
  status: string;
  analysis: string;
  analysisError: string | null;
  createdBy: string | null;
  createdAt: string;
  reviewNote: string | null;
  song: { id: string; index: number; title: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-sand text-text-muted",
  PUBLISHED: "bg-green-light text-forest",
  REJECTED: "bg-danger-light text-danger",
};

export const formatDuration = (ms: number | null) => {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Recordings with their review and analysis state; admins open the editor from here. */
export function RecordingList({ recordings, admin = false }: { recordings: RecordingItem[]; admin?: boolean }) {
  const t = useTranslations("recordings");
  const tm = useTranslations("music");
  const format = useFormatter();
  if (!recordings.length) return <p className="text-[13px] text-text-muted font-ui">{t("none")}</p>;

  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-2 font-ui">
      {recordings.map((r) => {
        const name = r.title || r.fileName || t("untitled");
        return (
          <li key={r.id} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] px-4 py-3">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="text-[14px] text-deep">
                  {admin ? <Link href={`/admin/recordings/${r.id}`}>{name}</Link> : name}
                  {r.source === "AI" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-sand text-text-body">{t("aiLabel")}</span>}
                  {r.source === "RENDER" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-sand text-text-body">{t("renderLabel")}</span>}
                </div>
                <div className="text-[12px] text-text-body">{r.song ? `#${r.song.index} ${r.song.title}` : t("hymnUnknown")}</div>
                <div className="text-[11px] text-text-muted">
                  {[r.performer, formatDuration(r.durationMs), r.createdBy, format.dateTime(new Date(r.createdAt), { dateStyle: "medium" })].filter(Boolean).join(" · ")}
                </div>
                <div className={`text-[11px] ${r.analysis === "FAILED" ? "text-danger" : "text-text-muted"}`}>
                  {t(`analysis.${r.analysis}`)}
                  {r.analysis === "FAILED" && r.analysisError ? ` : ${r.analysisError}` : ""}
                </div>
                {r.reviewNote && <div className="text-[11px] text-text-body mt-1">“{r.reviewNote}”</div>}
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium ${STATUS_STYLE[r.status] ?? ""}`}>{tm(`status.${r.status}`)}</span>
            </div>
            {r.fileUrl && <audio controls preload="none" src={r.fileUrl} className="w-full mt-2 h-9" />}
          </li>
        );
      })}
    </ul>
  );
}
