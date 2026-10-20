"use client";

import { createOutput, playNote, type Instrument } from "./synth";
import type { PlayNote, ScoreModel } from "./score-model";

export type VoiceState = { mute: boolean; solo: boolean; volume: number };

const LOOKAHEAD = 0.3; // seconds scheduled in advance
const TICK_MS = 60;

/**
 * Plays a ScoreModel with the synth. Score time is in milliseconds at the written tempo;
 * `rate` speeds it up or slows it down. Mixer, tempo and loop changes apply at once (resync).
 */
export class Playback {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private model: ScoreModel | null = null;
  private anchorCtx = 0;
  private anchorPos = 0;
  private scheduledUntil = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private live: Array<{ nodes: AudioScheduledSourceNode[]; until: number }> = [];
  private pausedAt = 0;
  /** Set when the anchor was moved ahead to the next loop pass (scheduled before it is heard). */
  private wrapped = false;

  playing = false;
  rate = 1;
  instrument: Instrument = "organ";
  voices: Record<string, VoiceState> = {};
  loop: { startMs: number; endMs: number } | null = null;
  onEnd: (() => void) | null = null;

  setModel(model: ScoreModel) {
    const wasPlaying = this.playing;
    const pos = this.position();
    this.stopSources();
    this.model = model;
    for (const v of model.voices) this.voices[v.key] ??= { mute: false, solo: false, volume: 1 };
    this.pausedAt = Math.min(pos, model.totalMs);
    if (wasPlaying) this.resync(this.pausedAt);
  }

  position(): number {
    if (!this.playing || !this.ctx) return this.pausedAt;
    const delta = (this.ctx.currentTime - this.anchorCtx) * 1000 * this.rate;
    // Still hearing the end of the previous pass.
    if (delta < 0 && this.wrapped && this.loop) return this.loop.endMs + delta;
    return Math.max(0, this.anchorPos + delta);
  }

  async play(from?: number) {
    if (!this.model) return;
    this.ctx ??= new AudioContext({ latencyHint: "interactive" });
    this.out ??= createOutput(this.ctx);
    await this.ctx.resume();
    let start = from ?? this.pausedAt;
    if (start >= this.model.totalMs - 1) start = this.loop?.startMs ?? 0;
    if (this.loop && (start < this.loop.startMs || start >= this.loop.endMs)) start = this.loop.startMs;
    this.playing = true;
    this.resync(start);
    this.timer ??= setInterval(() => this.tick(), TICK_MS);
  }

  pause() {
    this.pausedAt = this.position();
    this.playing = false;
    this.stopSources();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  stop() {
    this.pause();
    this.pausedAt = this.loop?.startMs ?? 0;
  }

  seek(ms: number) {
    if (this.playing) this.resync(ms);
    else this.pausedAt = ms;
  }

  /** Call after changing rate, voices, instrument or loop. */
  refresh() {
    if (this.playing) this.resync(this.position());
  }

  dispose() {
    this.pause();
    void this.ctx?.close();
    this.ctx = null;
    this.out = null;
  }

  private resync(pos: number) {
    if (!this.ctx) return;
    this.stopSources();
    this.wrapped = false;
    this.anchorCtx = this.ctx.currentTime + 0.03;
    this.anchorPos = pos;
    this.scheduledUntil = pos;
    this.tick();
  }

  private audibleVolume(n: PlayNote): number {
    const soloing = Object.values(this.voices).some((v) => v.solo);
    let vol = 0;
    for (const key of n.voices) {
      const v = this.voices[key];
      if (!v || v.mute || (soloing && !v.solo)) continue;
      vol = Math.max(vol, v.volume);
    }
    return n.voices.length ? vol : soloing ? 0 : 1;
  }

  private ctxTimeAt(pos: number) {
    return this.anchorCtx + (pos - this.anchorPos) / 1000 / this.rate;
  }

  private tick() {
    if (!this.playing || !this.ctx || !this.model || !this.out) return;
    const now = this.ctx.currentTime;
    this.live = this.live.filter((l) => l.until > now);
    const end = this.loop?.endMs ?? this.model.totalMs;
    let horizon = this.anchorPos + (now + LOOKAHEAD - this.anchorCtx) * 1000 * this.rate;

    // Several passes when the horizon crosses the loop end.
    for (let guard = 0; guard < 4 && this.scheduledUntil < horizon; guard++) {
      const segEnd = Math.min(horizon, end);
      for (const n of this.model.notes) {
        if (n.startMs < this.scheduledUntil || n.startMs >= segEnd) continue;
        const vol = this.audibleVolume(n);
        if (vol <= 0) continue;
        const t0 = this.ctxTimeAt(n.startMs);
        const noteEnd = Math.min(n.endMs, end);
        const dur = ((noteEnd - n.startMs) / 1000 / this.rate) * 0.97;
        if (t0 < now - 0.02) continue;
        this.live.push({ nodes: playNote(this.ctx, this.out, this.instrument, n.pitch, t0, dur, vol), until: t0 + dur + 0.6 });
      }
      this.scheduledUntil = segEnd;
      if (segEnd >= end) {
        if (!this.loop) {
          // Let the last notes ring, then stop.
          const finish = (this.ctxTimeAt(end) - now) * 1000;
          setTimeout(() => {
            if (this.playing && this.position() >= end - 5) {
              this.pause();
              this.pausedAt = 0;
              this.onEnd?.();
            }
          }, Math.max(0, finish));
          return;
        }
        // Wrap: the loop start plays right when the loop end is reached.
        const wrapCtx = this.ctxTimeAt(end);
        this.anchorCtx = wrapCtx;
        this.wrapped = true;
        this.anchorPos = this.loop.startMs;
        this.scheduledUntil = this.loop.startMs;
        horizon = this.anchorPos + (now + LOOKAHEAD - this.anchorCtx) * 1000 * this.rate;
      }
    }
  }

  private stopSources() {
    const t = this.ctx?.currentTime ?? 0;
    for (const l of this.live) for (const n of l.nodes) {
      try {
        n.stop(t + 0.01);
      } catch {
        /* already stopped */
      }
    }
    this.live = [];
  }
}
