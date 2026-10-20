"use client";

import type { TimemapEvent, VerovioToolkit } from "./verovio";
import { assignVoices, type VoiceInfo } from "@/lib/music/voices";

/** Everything the player needs, read from Verovio's timemap and the rendered SVG. */

export type Syllable = { text: string; wordpos: string | null };

export type PlayNote = {
  id: string;
  pitch: number;
  startMs: number;
  endMs: number;
  startQ: number;
  endQ: number;
  voices: string[];
  measure: number; // index in `measures`
  system: number; // line of music (for karaoke lines)
  syl: Record<number, Syllable>; // by verse number
};

export type MeasureInfo = { id: string; n: string; startQ: number; endQ: number; startMs: number; endMs: number };

export type ScoreModel = {
  notes: PlayNote[];
  measures: MeasureInfo[];
  voices: VoiceInfo[];
  fifths: number;
  mode: "major" | "minor";
  meter: { count: number; unit: number };
  totalMs: number;
  totalQ: number;
  verses: number[];
};

/** Verovio options that tag the SVG with what the model reads. */
export const SVG_ATTRIBUTES = ["staff@n", "layer@n", "measure@n", "verse@n", "syl@wordpos"];

function parseSig(sig: string | undefined): number {
  if (!sig || sig === "0") return 0;
  const m = /^(\d+)([sf])$/.exec(sig);
  return m ? Number(m[1]) * (m[2] === "s" ? 1 : -1) : 0;
}

export function readKeyAndMeter(mei: string) {
  const keySig = /<keySig\b[^>]*>/.exec(mei)?.[0] ?? "";
  const sig = /\bsig="([^"]+)"/.exec(keySig)?.[1] ?? /\bkey\.sig="([^"]+)"/.exec(mei)?.[1];
  const mode = (/\bmode="(minor|major)"/.exec(keySig)?.[1] ?? /\bkey\.mode="(minor|major)"/.exec(mei)?.[1] ?? "major") as "major" | "minor";
  const meterSig = /<meterSig\b[^>]*>/.exec(mei)?.[0] ?? "";
  const count = Number(/\bcount="(\d+)"/.exec(meterSig)?.[1] ?? /\bmeter\.count="(\d+)"/.exec(mei)?.[1] ?? 4);
  const unit = Number(/\bunit="(\d+)"/.exec(meterSig)?.[1] ?? /\bmeter\.unit="(\d+)"/.exec(mei)?.[1] ?? 4);
  return { fifths: parseSig(sig), mode, meter: { count: count || 4, unit: unit || 4 } };
}

export function buildModel(tk: VerovioToolkit, root: HTMLElement): ScoreModel {
  const events: TimemapEvent[] = tk.renderToTimemap({ includeMeasures: true, includeRests: false });
  const starts = new Map<string, { ms: number; q: number }>();
  const ends = new Map<string, { ms: number; q: number }>();
  const measureStarts: Array<{ id: string; ms: number; q: number }> = [];
  let lastMs = 0;
  let lastQ = 0;
  for (const e of events) {
    lastMs = Math.max(lastMs, e.tstamp);
    lastQ = Math.max(lastQ, e.qstamp);
    if (e.measureOn) measureStarts.push({ id: e.measureOn, ms: e.tstamp, q: e.qstamp });
    for (const id of e.on ?? []) if (!starts.has(id)) starts.set(id, { ms: e.tstamp, q: e.qstamp });
    for (const id of e.off ?? []) ends.set(id, { ms: e.tstamp, q: e.qstamp });
  }

  const measures: MeasureInfo[] = measureStarts.map((m, i) => {
    const next = measureStarts[i + 1];
    const el = root.querySelector<SVGGElement>(`[id="${CSS.escape(m.id)}"]`);
    return { id: m.id, n: el?.dataset.n ?? String(i + 1), startQ: m.q, startMs: m.ms, endQ: next?.q ?? lastQ, endMs: next?.ms ?? lastMs };
  });
  const measureAt = (q: number) => {
    let idx = 0;
    for (let i = 0; i < measures.length; i++) if (measures[i].startQ <= q + 1e-6) idx = i;
    return idx;
  };

  const systems = [...root.querySelectorAll("g.system")];
  const raw: Array<{ id: string; staff: number; layer: number; pitch: number; onsetQ: number }> = [];
  const partial: Array<Omit<PlayNote, "voices">> = [];
  const verseSet = new Set<number>();
  for (const [id, s] of starts) {
    const el = root.querySelector<SVGGElement>(`[id="${CSS.escape(id)}"]`);
    if (!el || !el.classList.contains("note")) continue;
    const pitch = tk.getMIDIValuesForElement(id)?.pitch;
    if (typeof pitch !== "number" || pitch <= 0) continue;
    const staff = Number(el.closest<SVGGElement>("g.staff")?.dataset.n ?? 1);
    const layer = Number(el.closest<SVGGElement>("g.layer")?.dataset.n ?? 1);
    const end = ends.get(id) ?? { ms: lastMs, q: lastQ };
    const syl: Record<number, Syllable> = {};
    for (const verse of el.querySelectorAll<SVGGElement>("g.verse")) {
      const n = Number(verse.dataset.n ?? 1);
      const sylEl = verse.querySelector<SVGGElement>("g.syl");
      const text = sylEl?.textContent?.replace(/\s+/g, " ").trim();
      if (text) {
        syl[n] = { text, wordpos: sylEl?.dataset.wordpos ?? null };
        verseSet.add(n);
      }
    }
    const systemEl = el.closest("g.system");
    raw.push({ id, staff, layer, pitch, onsetQ: s.q });
    partial.push({
      id,
      pitch,
      startMs: s.ms,
      endMs: Math.max(end.ms, s.ms + 30),
      startQ: s.q,
      endQ: Math.max(end.q, s.q),
      measure: measureAt(s.q),
      system: systemEl ? systems.indexOf(systemEl) : 0,
      syl,
    });
  }

  const { voices, byNote } = assignVoices(raw);
  const notes = partial
    .map((n) => ({ ...n, voices: byNote.get(n.id) ?? [] }))
    .sort((a, b) => a.startMs - b.startMs || b.pitch - a.pitch);
  const { fifths, mode, meter } = readKeyAndMeter(tk.getMEI());
  return { notes, measures, voices, fifths, mode, meter, totalMs: lastMs, totalQ: lastQ, verses: [...verseSet].sort((a, b) => a - b) };
}

/** Karaoke lines: the syllables of one verse, grouped by line of music, joined into words. */
export function lyricLines(model: ScoreModel, verse: number) {
  const lines = new Map<number, Array<{ noteId: string; text: string; joinNext: boolean; startMs: number }>>();
  const seen = new Set<string>();
  for (const n of model.notes) {
    const s = n.syl[verse];
    if (!s) continue;
    // Several voices can carry the same syllable at the same time: keep the first.
    const key = `${n.startMs}:${s.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const arr = lines.get(n.system) ?? [];
    arr.push({ noteId: n.id, text: s.text, joinNext: s.wordpos === "i" || s.wordpos === "m", startMs: n.startMs });
    lines.set(n.system, arr);
  }
  return [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([system, syls]) => ({ system, syls }));
}
