/**
 * Small Web Audio synthesiser for rehearsal playback and for rendering audio files from a score.
 * Works with AudioContext (live) and OfflineAudioContext (rendering). No samples to download.
 */

export type Instrument = "organ" | "piano" | "choir";

export const INSTRUMENTS: Instrument[] = ["organ", "piano", "choir"];

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

let organWave: PeriodicWave | null = null;
let organCtx: BaseAudioContext | null = null;

function organ(ctx: BaseAudioContext): PeriodicWave {
  if (organWave && organCtx === ctx) return organWave;
  // Drawbar-like: 8', 4', 2 2/3', 2' and a little 16'.
  const real = new Float32Array([0, 1, 0.55, 0.35, 0.3, 0.12, 0.1, 0, 0.08]);
  const imag = new Float32Array(real.length);
  organWave = ctx.createPeriodicWave(real, imag);
  organCtx = ctx;
  return organWave;
}

/** Schedule one note. `start` and `dur` in seconds of the context clock. Returns the nodes to stop early. */
export function playNote(
  ctx: BaseAudioContext,
  dest: AudioNode,
  instrument: Instrument,
  midi: number,
  start: number,
  dur: number,
  volume = 1,
): AudioScheduledSourceNode[] {
  const f = freq(midi);
  const gain = ctx.createGain();
  gain.connect(dest);
  const peak = 0.18 * volume;
  const end = start + Math.max(0.05, dur);
  const g = gain.gain;
  g.setValueAtTime(0, start);

  const sources: AudioScheduledSourceNode[] = [];
  if (instrument === "piano") {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(gain);
    o2.connect(g2).connect(gain);
    g.linearRampToValueAtTime(peak * 1.4, start + 0.005);
    // Decays like a struck string, released at the end of the note.
    g.setTargetAtTime(peak * 0.25, start + 0.01, 0.6);
    g.setTargetAtTime(0, end, 0.08);
    sources.push(o, o2);
  } else if (instrument === "choir") {
    // Sawtooth through two vowel formants ("ah"), slow attack and gentle vibrato.
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.2;
    const depth = ctx.createGain();
    depth.gain.value = f * 0.006;
    lfo.connect(depth).connect(o.frequency);
    const f1 = ctx.createBiquadFilter();
    f1.type = "bandpass";
    f1.frequency.value = 750;
    f1.Q.value = 6;
    const f2 = ctx.createBiquadFilter();
    f2.type = "bandpass";
    f2.frequency.value = 1150;
    f2.Q.value = 8;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 2400;
    o.connect(f1).connect(gain);
    o.connect(f2).connect(gain);
    o.connect(low);
    const lowGain = ctx.createGain();
    lowGain.gain.value = 0.12;
    low.connect(lowGain).connect(gain);
    g.linearRampToValueAtTime(peak * 1.6, start + 0.09);
    g.setValueAtTime(peak * 1.6, Math.max(start + 0.09, end - 0.06));
    g.linearRampToValueAtTime(0, end + 0.04);
    sources.push(o, lfo);
  } else {
    const o = ctx.createOscillator();
    o.setPeriodicWave(organ(ctx));
    o.frequency.value = f;
    o.connect(gain);
    g.linearRampToValueAtTime(peak, start + 0.02);
    g.setValueAtTime(peak, Math.max(start + 0.02, end - 0.03));
    g.linearRampToValueAtTime(0, end + 0.02);
    sources.push(o);
  }
  const stopAt = end + (instrument === "piano" ? 0.5 : 0.1);
  for (const s of sources) {
    s.start(start);
    s.stop(stopAt);
  }
  return sources;
}

/** Master chain with a soft compressor so chords never clip. */
export function createOutput(ctx: BaseAudioContext): GainNode {
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  return master;
}
