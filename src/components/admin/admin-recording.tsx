"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Crosshair, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { lineAt, type KaraokeLine } from "@/components/music/karaoke-audio";

type Rec = {
  id: string;
  title: string | null;
  performer: string | null;
  notes: string | null;
  fileName: string | null;
  fileUrl: string | null;
  durationMs: number | null;
  source: string;
  generator: string | null;
  status: string;
  analysis: string;
  analysisError: string | null;
  analysisLog: Array<{ step: string; ok: boolean; info?: string }>;
  transcript: { provider: string; text: string } | null;
  correctedText: string | null;
  matches: Array<{ songId: string; index: number; title: string; score: number }>;
  alignment: KaraokeLine[];
  alignmentSource: string | null;
  melodyUrl: string | null;
  song: { id: string; index: number; title: string; tuneId: string | null } | null;
};

const fmt = (ms: number | null | undefined) => {
  if (ms == null) return "";
  const s = ms / 1000;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};
const parseTime = (v: string): number | null => {
  const m = /^\s*(?:(\d+):)?(\d+(?:[.,]\d+)?)\s*$/.exec(v);
  if (!m) return null;
  return Math.round(((m[1] ? Number(m[1]) * 60 : 0) + Number(m[2].replace(",", "."))) * 1000);
};

/**
 * Everything an admin checks before a recording goes public: the hymn, the transcription and
 * its correction (kept as a sample for later corrections), the karaoke timing, the melody draft.
 * Timing: play the audio and tap (button or space bar) at the start of each line.
 */
export function AdminRecording({ recording: r, lines: initialLines }: { recording: Rec; lines: string[] }) {
  const t = useTranslations("recordings");
  const tm = useTranslations("music");
  const tc = useTranslations("common");
  const router = useRouter();
  const audio = useRef<HTMLAudioElement>(null);
  const [lines, setLines] = useState(initialLines);
  const [hymn, setHymn] = useState(r.song ? String(r.song.index) : "");
  const [title, setTitle] = useState(r.title ?? "");
  const [performer, setPerformer] = useState(r.performer ?? "");
  const [notes, setNotes] = useState(r.notes ?? "");
  const [corrected, setCorrected] = useState(r.correctedText ?? "");
  const [starts, setStarts] = useState<Array<number | null>>(() => initialLines.map((_, i) => r.alignment.find((a) => a.line === i)?.startMs ?? null));
  const [cursor, setCursor] = useState(0);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Follow the audio for the "current line" highlight.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const on = () => setNow(el.currentTime * 1000);
    el.addEventListener("timeupdate", on);
    el.addEventListener("seeked", on);
    return () => {
      el.removeEventListener("timeupdate", on);
      el.removeEventListener("seeked", on);
    };
  }, []);

  const tap = () => {
    if (!audio.current || cursor >= lines.length) return;
    const ms = Math.round(audio.current.currentTime * 1000);
    setStarts((s) => s.map((v, i) => (i === cursor ? ms : v)));
    setCursor((c) => c + 1);
  };
  const tapRef = useRef(tap);
  useEffect(() => {
    tapRef.current = tap;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.code !== "Space" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      if (audio.current?.paused) return;
      e.preventDefault();
      tapRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const call = async (body: Record<string, unknown>, okText = t("saved")) => {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/recordings/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) {
      const err = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "";
      setMessage({ ok: false, text: t.has(`errors.${err}`) ? t(`errors.${err}` as "errors.FAILED") : tc("error") });
      return null;
    }
    setMessage({ ok: true, text: okText });
    router.refresh();
    return (await res.json().catch(() => ({}))) as { recording?: Rec };
  };

  const changeHymn = async (index: number) => {
    const songId = (await call({ action: "edit", songIndex: index }))?.recording?.song?.id;
    if (!songId) return;
    setHymn(String(index));
    const data = (await (await fetch(`/api/admin/recordings/${r.id}/lines?songId=${songId}`)).json()) as { lines: string[] };
    setLines(data.lines);
    setStarts(data.lines.map(() => null));
    setCursor(0);
  };

  const timing = (): KaraokeLine[] => {
    const set = starts.map((s, i) => ({ s, i })).filter((x): x is { s: number; i: number } => x.s != null).sort((a, b) => a.s - b.s);
    return set.map((x, k) => ({
      line: x.i,
      text: lines[x.i] ?? "",
      startMs: x.s,
      endMs: set[k + 1]?.s ?? r.durationMs ?? x.s + 5000,
    }));
  };
  const current = lineAt(timing(), now);
  const currentLine = current >= 0 ? timing()[current].line : -1;

  const seek = (ms: number) => {
    if (!audio.current) return;
    audio.current.currentTime = ms / 1000;
    void audio.current.play();
  };

  const btn = "inline-flex items-center text-[12px] px-2 py-1 rounded-[var(--radius-pill)] bg-sand text-text-body border-none cursor-pointer disabled:opacity-50";
  const field = "bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep w-full";

  return (
    <div className="font-ui flex flex-col gap-6">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-[26px] text-deep font-display m-0">{r.title || r.fileName || t("untitled")}</h1>
          <div className="text-[13px] text-text-body">
            {r.song ? <Link href={`/songs/${r.song.index}`}>#{r.song.index} {r.song.title}</Link> : t("hymnUnknown")}
            {r.source === "AI" && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-sand">{t("aiLabel")}{r.generator ? ` · ${r.generator}` : ""}</span>}
          </div>
          <div className="text-[12px] text-text-muted">
            {tm(`status.${r.status}`)} · {t(`analysis.${r.analysis}`)}
            {r.analysisError ? ` : ${r.analysisError}` : ""}
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {r.status !== "PUBLISHED" && (
            <button type="button" disabled={busy || !r.fileUrl || !r.song} className={`${btn} !bg-forest !text-parchment`} onClick={() => call({ action: "publish" }, tm("status.PUBLISHED"))}>
              {tm("publish")}
            </button>
          )}
          {r.status === "PUBLISHED" && (
            <button type="button" disabled={busy} className={btn} onClick={() => call({ action: "unpublish" })}>
              {tm("unpublish")}
            </button>
          )}
          {r.status !== "REJECTED" && (
            <button
              type="button"
              disabled={busy}
              className={btn}
              onClick={() => {
                const note = prompt(tm("rejectReason"));
                if (note !== null) void call({ action: "reject", ...(note.trim() ? { note: note.trim() } : {}) });
              }}
            >
              {tm("reject")}
            </button>
          )}
          <button type="button" disabled={busy || r.analysis === "RUNNING"} className={btn} onClick={() => call({ action: "reanalyze" }, t("queued"))}>
            {t("reanalyze")}
          </button>
        </div>
      </div>
      {message && (
        <p role="status" className={`text-[12px] m-0 ${message.ok ? "text-forest" : "text-danger"}`}>
          {message.text}
        </p>
      )}

      {r.fileUrl ? (
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 bg-parchment py-2 flex items-center gap-2 flex-wrap border-b-[0.5px] border-stone">
          <audio ref={audio} controls preload="metadata" src={r.fileUrl} className="flex-1 min-w-[240px] h-10" />
          <Button type="button" onClick={tap} disabled={cursor >= lines.length}>
            {t("tap")} {cursor < lines.length ? `(${cursor + 1}/${lines.length})` : ""}
          </Button>
        </div>
      ) : (
        <p className="text-[13px] text-text-muted">{t("noAudioYet")}</p>
      )}

      <section>
        <SectionLabel>{t("details")}</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-end gap-2">
            <Input id="rec-hymn" type="number" min={1} label={t("hymnNumber")} value={hymn} onChange={(e) => setHymn(e.target.value)} />
            <button type="button" className={btn} disabled={busy || !hymn || Number(hymn) === r.song?.index} onClick={() => changeHymn(Number(hymn))}>
              {t("setHymn")}
            </button>
          </div>
          <div className="text-[12px] text-text-body flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted">{t("matches")}</span>
            {r.matches.length ? (
              <div className="flex flex-wrap gap-1">
                {r.matches.map((m) => (
                  <button key={m.songId} type="button" className={btn} disabled={busy || m.songId === r.song?.id} onClick={() => changeHymn(m.index)} title={m.title}>
                    #{m.index} · {Math.round(m.score * 100)} %
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-text-muted">{t("noMatches")}</span>
            )}
          </div>
          <Input id="rec-title" label={t("title")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input id="rec-performer" label={t("performer")} value={performer} onChange={(e) => setPerformer(e.target.value)} />
          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted">{t("notes")}</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={field} />
          </label>
          <div>
            <Button type="button" disabled={busy} onClick={() => call({ action: "edit", title: title.trim() || null, performer: performer.trim() || null, notes: notes.trim() || null })}>
              {tc("save")}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>{t("timing")}</SectionLabel>
        <p className="text-[12px] text-text-muted mt-0">
          {t("timingHelp")} {r.alignmentSource && `(${t(`alignmentSource.${r.alignmentSource}` as "alignmentSource.auto")})`}
        </p>
        {lines.length ? (
          <>
            <ol className="list-none m-0 p-0 flex flex-col gap-0.5">
              {lines.map((text, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${i === currentLine ? "bg-green-light" : i === cursor ? "outline outline-1 outline-forest" : ""}`}
                >
                  <input
                    aria-label={t("startOf", { n: i + 1 })}
                    value={starts[i] != null ? fmt(starts[i]) : ""}
                    placeholder="–"
                    onChange={(e) => {
                      const v = e.target.value.trim() ? parseTime(e.target.value) : null;
                      if (v !== null || !e.target.value.trim()) setStarts((s) => s.map((x, k) => (k === i ? v : x)));
                    }}
                    className="w-20 bg-linen border-[0.5px] border-stone rounded px-1.5 py-0.5 text-[12px] tabular-nums"
                  />
                  <button type="button" className={btn} disabled={starts[i] == null} onClick={() => seek(starts[i] ?? 0)} aria-label={t("playFrom")} title={t("playFrom")}>
                    <Play size={12} />
                  </button>
                  <button type="button" className={btn} onClick={() => setCursor(i)} aria-label={t("tapFromHere")} title={t("tapFromHere")}>
                    <Crosshair size={12} />
                  </button>
                  <span className={`flex-1 font-display text-[15px] ${starts[i] == null ? "text-text-muted" : "text-deep"}`}>{text}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button type="button" disabled={busy} onClick={() => call({ action: "edit", alignment: timing() })}>
                {t("saveTiming")}
              </Button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  setStarts(lines.map(() => null));
                  setCursor(0);
                }}
              >
                {t("clearTiming")}
              </button>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-text-muted">{t("pickHymnFirst")}</p>
        )}
      </section>

      <section>
        <SectionLabel>{t("transcription")}</SectionLabel>
        {r.transcript ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted">
                {t("rawTranscript")} · {r.transcript.provider}
              </span>
              <div className="bg-linen rounded-[var(--radius-md)] p-3 text-[13px] whitespace-pre-wrap max-h-72 overflow-auto">{r.transcript.text}</div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted">{t("correctedTranscript")}</span>
              <textarea value={corrected} onChange={(e) => setCorrected(e.target.value)} rows={10} className={`${field} font-display text-[15px]`} lang="dua" />
              <span className="text-[11px] text-text-muted">{t("correctionHelp")}</span>
              <div>
                <Button type="button" disabled={busy || !corrected.trim()} onClick={() => call({ action: "edit", correctedText: corrected.trim() })}>
                  {t("validateCorrection")}
                </Button>
              </div>
            </label>
          </div>
        ) : (
          <p className="text-[13px] text-text-muted">{t("noTranscript")}</p>
        )}
      </section>

      <section>
        <SectionLabel>{t("melody")}</SectionLabel>
        {r.melodyUrl ? (
          <div className="flex gap-2 flex-wrap items-center text-[13px]">
            <a href={r.melodyUrl} className={`${btn} no-underline`} download>
              {t("downloadMidi")}
            </a>
            <button type="button" className={btn} disabled={busy || !r.song?.tuneId} onClick={() => call({ action: "melodyToScore" }, t("scoreDraftCreated"))}>
              {t("melodyToScore")}
            </button>
            {!r.song?.tuneId && <span className="text-[12px] text-text-muted">{t("needsTune")}</span>}
          </div>
        ) : (
          <p className="text-[13px] text-text-muted">{t("noMelody")}</p>
        )}
      </section>

      <section>
        <SectionLabel>{t("analysisReport")}</SectionLabel>
        {r.analysisLog.length ? (
          <ul className="list-none m-0 p-0 text-[12px] flex flex-col gap-0.5">
            {r.analysisLog.map((l, i) => (
              <li key={i} className={l.ok ? "text-text-body" : "text-text-muted"}>
                {l.ok ? "✓" : "–"} <strong>{t.has(`steps.${l.step}`) ? t(`steps.${l.step}` as "steps.audio") : l.step}</strong> {l.info}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-text-muted">{t(`analysis.${r.analysis}`)}</p>
        )}
      </section>
    </div>
  );
}
