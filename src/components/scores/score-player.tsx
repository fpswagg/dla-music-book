"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, Minus, Pause, Play, Plus, Repeat, Square, Volume2, VolumeX } from "lucide-react";
import { createToolkit, type VerovioToolkit } from "./verovio";
import { buildModel, lyricLines, readKeyAndMeter, SVG_ATTRIBUTES, type ScoreModel } from "./score-model";
import { Playback, type VoiceState } from "./playback";
import { INSTRUMENTS, type Instrument } from "./synth";
import { SolfaView } from "./solfa-view";
import { pcName, tonicPc, transposeOption } from "@/lib/music/keys";

export type PlayerScore = { id: string; label: string; status?: string };

type View = "staff" | "solfa";

const ZOOMS = [30, 35, 40, 45, 50, 60, 70];

/**
 * Interactive score: engraving (Verovio), synthesised playback with a cursor that follows the notes,
 * karaoke lyrics, rehearsal mixer (solo / mute per voice), tempo, loop, transposition, sol-fa view
 * and PDF export (print dialog).
 */
export function ScorePlayer({ score, title }: { score: PlayerScore; title: string }) {
  const t = useTranslations("score");
  const containerRef = useRef<HTMLDivElement>(null);
  const tkRef = useRef<VerovioToolkit | null>(null);
  const contentRef = useRef<string>("");
  const playback = useRef<Playback | null>(null);
  const highlighted = useRef<Set<string>>(new Set());
  const original = useRef<{ fifths: number; mode: "major" | "minor" } | null>(null);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [model, setModel] = useState<ScoreModel | null>(null);
  const [view, setView] = useState<View>("staff");
  const [zoom, setZoom] = useState(40);
  const [semitones, setSemitones] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [instrument, setInstrument] = useState<Instrument>("organ");
  const [voices, setVoices] = useState<Record<string, VoiceState>>({});
  const [loopOn, setLoopOn] = useState(false);
  const [loopFrom, setLoopFrom] = useState(0);
  const [loopTo, setLoopTo] = useState(0);
  const [verse, setVerse] = useState<number | null>(null);
  const [position, setPosition] = useState(0);
  const [panel, setPanel] = useState(false);
  const [orig, setOrig] = useState<{ fifths: number; mode: "major" | "minor" } | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);

  playback.current ??= new Playback();

  // ── Rendering ────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const tk = tkRef.current;
    const el = containerRef.current;
    if (!tk || !el || !contentRef.current) return;
    const width = Math.max(320, el.clientWidth);
    if (!original.current) {
      tk.setOptions({ transpose: "" });
      tk.loadData(contentRef.current);
      const k = readKeyAndMeter(tk.getMEI());
      original.current = { fifths: k.fifths, mode: k.mode };
    }
    tk.setOptions({
      scale: zoom,
      pageWidth: Math.round((width * 100) / zoom),
      pageHeight: 60000,
      adjustPageHeight: true,
      breaks: "auto",
      header: "none",
      footer: "none",
      pageMarginLeft: 20,
      pageMarginRight: 20,
      pageMarginTop: 20,
      pageMarginBottom: 20,
      svgAdditionalAttribute: SVG_ATTRIBUTES,
      transpose: transposeOption(original.current.fifths, original.current.mode, semitones),
    });
    tk.loadData(contentRef.current);
    const pages = tk.getPageCount();
    let svg = "";
    for (let p = 1; p <= pages; p++) svg += tk.renderToSVG(p);
    el.innerHTML = svg;
    highlighted.current.clear();
    const m = buildModel(tk, el);
    setModel(m);
    setOrig(original.current);
    setTempo(tk.renderToTimemap({ includeMeasures: false }).find((e) => e.tempo)?.tempo ?? null);
    setLoopFrom((f) => Math.min(f, m.measures.length - 1));
    setLoopTo((x) => (x > 0 ? Math.min(x, m.measures.length - 1) : m.measures.length - 1));
    playback.current!.setModel(m);
    setVoices({ ...playback.current!.voices });
    setVerse((v) => (v !== null && m.verses.includes(v) ? v : (m.verses[0] ?? null)));
  }, [zoom, semitones]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tk, res] = await Promise.all([createToolkit(), fetch(`/api/scores/${score.id}/content`)]);
        if (!res.ok) throw new Error(String(res.status));
        contentRef.current = await res.text();
        if (cancelled) return;
        tkRef.current = tk;
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    const pb = playback.current!;
    return () => {
      cancelled = true;
      pb.dispose();
    };
  }, [score.id]);

  useEffect(() => {
    if (state !== "ready") return;
    render();
  }, [state, render]);

  // Re-layout when the width changes (rotation, window resize).
  useEffect(() => {
    if (state !== "ready" || !containerRef.current) return;
    let last = containerRef.current.clientWidth;
    let timer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (Math.abs(w - last) < 24) return;
      last = w;
      clearTimeout(timer);
      timer = setTimeout(render, 250);
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [state, render]);

  // ── Playback state → engine ──────────────────────────────────────────────
  useEffect(() => {
    const pb = playback.current!;
    pb.rate = rate;
    pb.instrument = instrument;
    pb.voices = voices;
    pb.loop =
      loopOn && model && model.measures.length
        ? {
            startMs: model.measures[Math.min(loopFrom, loopTo)].startMs,
            endMs: model.measures[Math.max(loopFrom, loopTo)].endMs,
          }
        : null;
    pb.refresh();
  }, [rate, instrument, voices, loopOn, loopFrom, loopTo, model]);


  useEffect(() => {
    playback.current!.onEnd = () => setPlaying(false);
  }, []);

  // ── Cursor, highlighted notes and karaoke (animation frame while playing) ─
  const highlight = useCallback(
    (pos: number) => {
      const el = containerRef.current;
      if (!model || !el) return;
      const now = new Set<string>();
      for (const n of model.notes) {
        if (n.startMs > pos) break;
        if (n.endMs > pos) now.add(n.id);
      }
      for (const id of highlighted.current) if (!now.has(id)) el.querySelector(`[id="${CSS.escape(id)}"]`)?.classList.remove("is-playing");
      let first: Element | null = null;
      for (const id of now) {
        const node = el.querySelector(`[id="${CSS.escape(id)}"]`);
        if (!node) continue;
        node.classList.add("is-playing");
        first ??= node;
      }
      highlighted.current = now;
      if (first && view === "staff") {
        const r = (first as SVGGraphicsElement).getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.top < 120 || r.bottom > vh - 80) first.closest("g.system")?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [model, view],
  );

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const frame = () => {
      const pos = playback.current!.position();
      setPosition(pos);
      highlight(pos);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, highlight]);

  const toggle = async () => {
    const pb = playback.current!;
    if (pb.playing) {
      pb.pause();
      setPlaying(false);
    } else {
      await pb.play();
      setPlaying(true);
    }
  };

  const stop = () => {
    playback.current!.stop();
    setPlaying(false);
    const pos = playback.current!.position();
    setPosition(pos);
    highlight(-1);
  };

  const seek = (ms: number) => {
    playback.current!.seek(ms);
    setPosition(ms);
    highlight(ms);
  };

  // Tap a note (or a bar) to start from there.
  const onScoreClick = (e: React.MouseEvent) => {
    if (!model) return;
    const target = e.target as Element;
    const note = target.closest("g.note");
    if (note) {
      const n = model.notes.find((x) => x.id === note.id);
      if (n) return seek(n.startMs);
    }
    const measure = target.closest("g.measure");
    if (measure) {
      const m = model.measures.find((x) => x.id === measure.id);
      if (m) seek(m.startMs);
    }
  };

  const setVoice = (key: string, patch: Partial<VoiceState>) => setVoices((v) => ({ ...v, [key]: { ...v[key], ...patch } }));

  // ── Derived display values ───────────────────────────────────────────────
  const currentMeasure = useMemo(() => {
    if (!model) return 0;
    let idx = 0;
    model.measures.forEach((m, i) => {
      if (m.startMs <= position) idx = i;
    });
    return idx;
  }, [model, position]);

  const lines = useMemo(() => (model && verse !== null ? lyricLines(model, verse) : []), [model, verse]);
  const karaoke = useMemo(() => {
    if (!lines.length) return null;
    let line = lines[0];
    for (const l of lines) if (l.syls[0] && l.syls[0].startMs <= position) line = l;
    let current = -1;
    line.syls.forEach((s, i) => {
      if (s.startMs <= position) current = i;
    });
    return { line, current };
  }, [lines, position]);

  const names = t("noteNames").split(",");
  const keyLabel = model
    ? `${pcName(tonicPc(model.fifths, model.mode), names)}${model.mode === "minor" ? ` ${t("minor")}` : ""}`
    : "";

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.round(ms / 1000 / rate));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  // ── PDF: print the score on its own page (the browser saves it as PDF) ──
  const exportPdf = () => {
    const tk = tkRef.current;
    if (!tk || !original.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    tk.setOptions({
      scale: 40,
      pageWidth: 2100,
      pageHeight: 2970,
      adjustPageHeight: false,
      pageMarginLeft: 100,
      pageMarginRight: 100,
      pageMarginTop: 80,
      pageMarginBottom: 80,
      breaks: "auto",
      header: "none",
      footer: "none",
    });
    tk.loadData(contentRef.current);
    const pages: string[] = [];
    for (let p = 1; p <= tk.getPageCount(); p++) pages.push(tk.renderToSVG(p));
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} — ${esc(score.label)}</title>` +
        `<style>@page{size:A4;margin:0}body{margin:0}h1{font:600 18px Georgia,serif;margin:14mm 14mm 0}.p{width:210mm;height:297mm;page-break-after:always;overflow:hidden}.p svg{width:100%;height:auto}</style>` +
        `</head><body><h1>${esc(title)}</h1>${pages.map((s) => `<div class="p">${s}</div>`).join("")}` +
        `<script>window.onload=()=>{window.print()}</script></body></html>`,
    );
    win.document.close();
    render(); // back to the screen layout
  };

  if (state === "error") return <p className="text-[13px] text-text-muted font-ui">{t("loadError")}</p>;

  return (
    <div className="score-player font-ui">
      {/* Transport */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 bg-parchment/95 backdrop-blur border-b-[0.5px] border-stone py-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggle}
            disabled={!model}
            className="w-10 h-10 rounded-full bg-forest text-parchment inline-flex items-center justify-center disabled:opacity-50 cursor-pointer"
            aria-label={playing ? t("pause") : t("play")}
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button type="button" onClick={stop} disabled={!model} className="w-9 h-9 rounded-full bg-sand text-text-body inline-flex items-center justify-center cursor-pointer" aria-label={t("stop")}>
            <Square size={14} />
          </button>
          <span className="text-[12px] tabular-nums text-text-muted min-w-[84px]">
            {fmt(position)} / {fmt(model?.totalMs ?? 0)}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="inline-flex rounded-[var(--radius-pill)] bg-sand p-0.5 text-[12px]" role="tablist">
              {(["staff", "solfa"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-[var(--radius-pill)] cursor-pointer ${view === v ? "bg-forest text-parchment" : "text-text-body"}`}
                >
                  {t(v)}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPanel((p) => !p)} className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] cursor-pointer ${panel ? "bg-forest text-parchment" : "bg-sand text-text-body"}`} aria-expanded={panel}>
              {t("rehearse")}
            </button>
          </div>
        </div>

        {karaoke && (
          <p className="mt-2 mb-0 text-center text-[16px] leading-snug font-display text-text-body" aria-live="off">
            {karaoke.line.syls.map((s, i) => (
              <span key={s.noteId} className={i === karaoke.current ? "text-forest font-semibold" : i < karaoke.current ? "text-deep" : "text-text-muted"}>
                {s.text}
                {s.joinNext ? "" : " "}
              </span>
            ))}
          </p>
        )}
      </div>

      {panel && model && (
        <div className="mb-3 grid gap-3 sm:grid-cols-2 text-[12px] bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-3">
          {model.voices.length > 1 && (
            <div className="sm:col-span-2">
              <div className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-1">{t("voices")}</div>
              <div className="flex flex-wrap gap-2">
                {model.voices.map((v) => {
                  const st = voices[v.key] ?? { mute: false, solo: false, volume: 1 };
                  return (
                    <div key={v.key} className="flex items-center gap-1 bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-2 py-1">
                      <span className="w-14 truncate font-medium text-deep">{v.label ? t(`voice.${v.label}`) : t("voiceN", { n: v.index + 1 })}</span>
                      <button type="button" onClick={() => setVoice(v.key, { solo: !st.solo })} className={`px-1.5 rounded cursor-pointer ${st.solo ? "bg-forest text-parchment" : "bg-sand"}`} aria-pressed={st.solo} title={t("solo")}>
                        S
                      </button>
                      <button type="button" onClick={() => setVoice(v.key, { mute: !st.mute })} className={`p-0.5 rounded cursor-pointer ${st.mute ? "bg-danger-light text-danger" : "bg-sand"}`} aria-pressed={st.mute} title={t("mute")}>
                        {st.mute ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                      <input type="range" min={0} max={1} step={0.05} value={st.volume} onChange={(e) => setVoice(v.key, { volume: Number(e.target.value) })} className="w-16 accent-[var(--color-forest)]" aria-label={t("volume")} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2">
            <span className="w-20 text-text-muted">{t("tempo")}</span>
            <input type="range" min={0.4} max={1.5} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="flex-1 accent-[var(--color-forest)]" />
            <span className="w-16 tabular-nums text-right">{tempo ? `${Math.round(tempo * rate)} bpm` : `${Math.round(rate * 100)} %`}</span>
          </label>
          <label className="flex items-center gap-2">
            <span className="w-20 text-text-muted">{t("key")}</span>
            <select value={semitones} onChange={(e) => setSemitones(Number(e.target.value))} className="flex-1 bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-2 py-1">
              {Array.from({ length: 12 }, (_, i) => i - 5).map((s) => {
                const o = orig;
                const label = o ? pcName(tonicPc(o.fifths, o.mode) + s, names) + (o.mode === "minor" ? ` ${t("minor")}` : "") : String(s);
                return (
                  <option key={s} value={s}>
                    {label} {s === 0 ? `(${t("asWritten")})` : `(${s > 0 ? "+" : ""}${s})`}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="w-20 text-text-muted">{t("sound")}</span>
            <select value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)} className="flex-1 bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-2 py-1">
              {INSTRUMENTS.map((i) => (
                <option key={i} value={i}>
                  {t(`instrument.${i}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setLoopOn((l) => !l)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] cursor-pointer ${loopOn ? "bg-forest text-parchment" : "bg-sand"}`} aria-pressed={loopOn}>
              <Repeat size={13} /> {t("loop")}
            </button>
            <select value={loopFrom} onChange={(e) => setLoopFrom(Number(e.target.value))} className="bg-linen border-[0.5px] border-stone rounded px-1 py-0.5" aria-label={t("loopFrom")}>
              {model.measures.map((m, i) => (
                <option key={m.id} value={i}>
                  {t("measureN", { n: m.n })}
                </option>
              ))}
            </select>
            <span>→</span>
            <select value={loopTo} onChange={(e) => setLoopTo(Number(e.target.value))} className="bg-linen border-[0.5px] border-stone rounded px-1 py-0.5" aria-label={t("loopTo")}>
              {model.measures.map((m, i) => (
                <option key={m.id} value={i}>
                  {t("measureN", { n: m.n })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {model.verses.length > 1 && (
              <label className="flex items-center gap-1">
                <span className="text-text-muted">{t("verse")}</span>
                <select value={verse ?? ""} onChange={(e) => setVerse(Number(e.target.value))} className="bg-linen border-[0.5px] border-stone rounded px-1 py-0.5">
                  {model.verses.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span className="text-text-muted">{t("zoom")}</span>
            <button type="button" onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])} className="p-1 rounded bg-sand cursor-pointer" aria-label={t("zoomOut")}>
              <Minus size={13} />
            </button>
            <button type="button" onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])} className="p-1 rounded bg-sand cursor-pointer" aria-label={t("zoomIn")}>
              <Plus size={13} />
            </button>
            <button type="button" onClick={exportPdf} className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] bg-sand cursor-pointer ml-auto">
              <FileDown size={13} /> {t("pdf")}
            </button>
          </div>
        </div>
      )}
      {model && (
        <p className="mt-0 mb-2 text-[11px] text-text-muted">
          {t("keyIs", { key: keyLabel })} · {model.meter.count}/{model.meter.unit} · {t("tapToStart")}
        </p>
      )}

      {state === "loading" && <p className="text-[13px] text-text-muted py-8 text-center">{t("loading")}</p>}
      <div ref={containerRef} onClick={onScoreClick} className={`score-svg ${view === "staff" ? "" : "hidden"}`} />
      {view === "solfa" && model && (
        <SolfaView model={model} verse={verse} currentMeasure={currentMeasure} onSeekMeasure={(i) => seek(model.measures[i].startMs)} />
      )}
    </div>
  );
}
