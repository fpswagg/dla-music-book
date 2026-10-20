/**
 * Sets every melodic channel of a Standard MIDI File to one General MIDI instrument, so a score
 * exported by MuseScore can be rendered as organ, piano or choir by FluidSynth.
 */
export const INSTRUMENTS = { organ: 19, piano: 0, choir: 52 } as const;
export type Instrument = keyof typeof INSTRUMENTS;

const readVlq = (b: Uint8Array, p: number): [number, number] => {
  let v = 0;
  let c: number;
  do {
    c = b[p++];
    v = (v << 7) | (c & 0x7f);
  } while (c & 0x80);
  return [v, p];
};

function patchTrack(t: Uint8Array, program: number): Uint8Array {
  const out: number[] = [];
  // Program change on every melodic channel at the start (drums, channel 10, untouched).
  for (let ch = 0; ch < 16; ch++) if (ch !== 9) out.push(0x00, 0xc0 | ch, program);
  let p = 0;
  let status = 0;
  while (p < t.length) {
    const start = p;
    [, p] = readVlq(t, p);
    out.push(...t.subarray(start, p)); // delta time
    let s = t[p];
    if (s & 0x80) p++;
    else s = status; // running status
    if (s === 0xff) {
      const type = t[p++];
      const [len, q] = readVlq(t, p);
      out.push(0xff, type, ...t.subarray(p, q + len));
      p = q + len;
      continue;
    }
    if (s === 0xf0 || s === 0xf7) {
      const [len, q] = readVlq(t, p);
      out.push(s, ...t.subarray(p, q + len));
      p = q + len;
      continue;
    }
    status = s;
    const kind = s & 0xf0;
    const size = kind === 0xc0 || kind === 0xd0 ? 1 : 2;
    const data = Array.from(t.subarray(p, p + size));
    p += size;
    if (kind === 0xc0 && (s & 0x0f) !== 9) data[0] = program;
    out.push(s, ...data); // written without running status: always valid
  }
  return Uint8Array.from(out);
}

export function setMidiProgram(midi: Uint8Array, instrument: Instrument): Uint8Array {
  const program = INSTRUMENTS[instrument];
  const td = new TextDecoder("latin1");
  if (td.decode(midi.subarray(0, 4)) !== "MThd") throw new Error("Not a MIDI file");
  const view = new DataView(midi.buffer, midi.byteOffset, midi.byteLength);
  const parts: Uint8Array[] = [];
  let p = 0;
  while (p + 8 <= midi.length) {
    const id = td.decode(midi.subarray(p, p + 4));
    const len = view.getUint32(p + 4);
    const body = midi.subarray(p + 8, p + 8 + len);
    const data = id === "MTrk" ? patchTrack(body, program) : body;
    const head = new Uint8Array(8);
    head.set(midi.subarray(p, p + 4));
    new DataView(head.buffer).setUint32(4, data.length);
    parts.push(head, data);
    p += 8 + len;
  }
  const total = parts.reduce((n, x) => n + x.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const x of parts) {
    out.set(x, o);
    o += x.length;
  }
  return out;
}

/** Program numbers used per channel (for tests and checks). */
export function midiPrograms(midi: Uint8Array): number[] {
  const found = new Set<number>();
  const view = new DataView(midi.buffer, midi.byteOffset, midi.byteLength);
  let p = 14;
  while (p + 8 <= midi.length) {
    const len = view.getUint32(p + 4);
    const t = midi.subarray(p + 8, p + 8 + len);
    let q = 0;
    let status = 0;
    while (q < t.length) {
      [, q] = readVlq(t, q);
      let s = t[q];
      if (s & 0x80) q++;
      else s = status;
      if (s === 0xff) {
        q++;
        const [l, r] = readVlq(t, q);
        q = r + l;
        continue;
      }
      if (s === 0xf0 || s === 0xf7) {
        const [l, r] = readVlq(t, q);
        q = r + l;
        continue;
      }
      status = s;
      const kind = s & 0xf0;
      if (kind === 0xc0) found.add(t[q]);
      q += kind === 0xc0 || kind === 0xd0 ? 1 : 2;
    }
    p += 8 + len;
  }
  return [...found].sort((a, b) => a - b);
}
