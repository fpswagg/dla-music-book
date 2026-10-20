"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Star } from "lucide-react";

const ScorePlayer = dynamic(() => import("@/components/scores/score-player").then((m) => m.ScorePlayer), { ssr: false });

export type ScoreItem = {
  id: string;
  label: string;
  kind: string;
  status: string;
  conversion: string;
  conversionError: string | null;
  isDefault: boolean;
  source: string | null;
  license: string | null;
  originalName: string | null;
  originalUrl: string | null;
  createdBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  tune?: { id: string; name: string; songs?: number[] };
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-sand text-text-muted",
  PUBLISHED: "bg-green-light text-forest",
  REJECTED: "bg-danger-light text-danger",
};

/** Scores with their review state. Admins get the moderation buttons; everyone can preview a converted score. */
export function ScoreList({ scores, admin = false, showTune = false }: { scores: ScoreItem[]; admin?: boolean; showTune?: boolean }) {
  const t = useTranslations("music");
  const tc = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const act = async (id: string, action: string, extra: Record<string, unknown> = {}) => {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/admin/scores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setBusy(null);
    if (!res.ok) setError(res.status === 409 ? t("notConverted") : tc("error"));
    router.refresh();
  };

  if (!scores.length) return <p className="text-[13px] text-text-muted font-ui">{t("noScores")}</p>;
  const btn = "text-[12px] px-2 py-1 rounded-[var(--radius-pill)] bg-sand text-text-body border-none cursor-pointer disabled:opacity-50";

  return (
    <div className="font-ui">
      {error && <p role="alert" className="text-[12px] text-danger mb-2">{error}</p>}
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {scores.map((s) => (
          <li key={s.id} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] px-4 py-3">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="text-[14px] text-deep">
                  {s.label}
                  {s.isDefault && <span className="ml-2 text-[10px] text-forest inline-flex items-center gap-0.5"><Star size={10} fill="currentColor" /> {t("default")}</span>}
                </div>
                {showTune && s.tune && (
                  <div className="text-[12px] text-text-body">
                    {admin ? <Link href={`/admin/tunes/${s.tune.id}`}>{s.tune.name}</Link> : s.tune.name}
                    {s.tune.songs && s.tune.songs.length > 0 && <span className="text-text-muted"> · {s.tune.songs.map((n) => `#${n}`).join(", ")}</span>}
                  </div>
                )}
                <div className="text-[11px] text-text-muted">
                  {[t(`kinds.${s.kind}`), s.createdBy, format.dateTime(new Date(s.createdAt), { dateStyle: "medium" }), s.source, s.license].filter(Boolean).join(" · ")}
                </div>
                {s.conversion !== "READY" && (
                  <div className={`text-[11px] ${s.conversion === "FAILED" ? "text-danger" : "text-text-muted"}`}>
                    {s.conversion === "FAILED" ? t("conversionFailed", { error: s.conversionError ?? "" }) : t("converting")}
                  </div>
                )}
                {s.reviewNote && <div className="text-[11px] text-text-body mt-1">“{s.reviewNote}”</div>}
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium ${STATUS_STYLE[s.status] ?? ""}`}>{t(`status.${s.status}`)}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {s.conversion === "READY" && (
                <button type="button" className={btn} onClick={() => setOpen(open === s.id ? null : s.id)}>
                  {open === s.id ? t("hide") : t("preview")}
                </button>
              )}
              {s.originalUrl && (
                <a href={s.originalUrl} className={`${btn} no-underline`} target="_blank" rel="noreferrer">
                  {t("original")}
                </a>
              )}
              {admin && (
                <>
                  {s.status !== "PUBLISHED" && s.conversion === "READY" && (
                    <button type="button" disabled={busy === s.id} className={`${btn} !bg-forest !text-parchment`} onClick={() => act(s.id, "publish")}>
                      {t("publish")}
                    </button>
                  )}
                  {s.status !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={busy === s.id}
                      className={btn}
                      onClick={() => {
                        const note = prompt(t("rejectReason"));
                        if (note !== null) void act(s.id, "reject", note.trim() ? { note: note.trim() } : {});
                      }}
                    >
                      {t("reject")}
                    </button>
                  )}
                  {s.status === "PUBLISHED" && (
                    <button type="button" disabled={busy === s.id} className={btn} onClick={() => act(s.id, "unpublish")}>
                      {t("unpublish")}
                    </button>
                  )}
                  {s.status === "PUBLISHED" && !s.isDefault && (
                    <button type="button" disabled={busy === s.id} className={btn} onClick={() => act(s.id, "default")}>
                      {t("makeDefault")}
                    </button>
                  )}
                  {s.conversion === "FAILED" && (
                    <button type="button" disabled={busy === s.id} className={btn} onClick={() => act(s.id, "retry")}>
                      {t("retry")}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy === s.id}
                    className={btn}
                    onClick={() => {
                      const label = prompt(t("label"), s.label);
                      if (label && label.trim() && label.trim() !== s.label) void act(s.id, "edit", { label: label.trim() });
                    }}
                  >
                    {tc("edit")}
                  </button>
                </>
              )}
            </div>
            {open === s.id && (
              <div className="mt-3 border-t-[0.5px] border-stone pt-3">
                <ScorePlayer score={{ id: s.id, label: s.label, status: s.status }} title={s.tune?.name ?? s.label} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
